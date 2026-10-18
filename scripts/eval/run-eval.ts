// Checks that document search finds the right official pages: the expected
// page comes back, every result is a corpus or .gov page, the returned
// passages contain the key facts, and off-topic questions find nothing. Calls
// searchCorpus() directly (the same path as GET /api/search), so it needs
// GEMINI_API_KEY and DATABASE_URL in .env.local.
//
//   npm run eval
//
// Writes scripts/eval/results.md.

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

import { hasGeminiKey, searchCorpus, type CorpusHit } from "../../lib/corpusSearch";

interface Question {
  id: string;
  lang: "en" | "hi";
  question: string;
  expectedSourceUrls: string[];
  mustMention: string[];
  expectNoHits: boolean;
}

/** true = pass, false = fail, null = does not apply to this question. */
type Check = boolean | null;

interface Result {
  q: Question;
  hits: CorpusHit[];
  sourceHit: Check;
  allowedOnly: Check;
  noHits: Check;
  mentions: Check;
  ms: number;
}

const DIR = path.resolve(process.cwd(), "scripts/eval");
const DELAY_MS = 1000;

const QUESTIONS: Question[] = JSON.parse(fs.readFileSync(path.join(DIR, "questions.json"), "utf8"));
// The corpus pages: the URLs the questions expect, which are the pages search can return.
const CORPUS_URLS = new Set(QUESTIONS.flatMap((q) => q.expectedSourceUrls));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAllowed(url: string): boolean {
  if (CORPUS_URLS.has(url)) return true;
  try {
    return new URL(url).hostname.endsWith(".gov");
  } catch {
    return false;
  }
}

/**
 * After a key fails, lib/corpusSearch.ts skips it for 10 minutes. In the app
 * that saves time; here one hiccup would sink every later question, so each
 * question starts with both keys available.
 */
function resetKeyCooldowns() {
  (globalThis as { corpusKeyDownUntil?: Map<string, number> }).corpusKeyDownUntil?.clear();
}

async function ask(q: Question): Promise<Result> {
  resetKeyCooldowns();
  const start = performance.now();
  const hits = await searchCorpus(q.question);
  const ms = performance.now() - start;

  const urls = hits.map((h) => h.url);
  const text = hits.map((h) => h.text).join("\n").toLowerCase();

  return {
    q,
    hits,
    ms,
    sourceHit: q.expectedSourceUrls.length ? urls.some((u) => q.expectedSourceUrls.includes(u)) : null,
    allowedOnly: hits.length ? urls.every(isAllowed) : null,
    noHits: q.expectNoHits ? hits.length === 0 : null,
    // Each mustMention entry may list alternatives: "not needed|do not need".
    mentions: q.mustMention.length
      ? q.mustMention.every((m) => m.toLowerCase().split("|").some((alt) => text.includes(alt.trim())))
      : null,
  };
}

const mark = (c: Check) => (c === null ? "–" : c ? "✅" : "❌");
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ");
const CHECKS = ["sourceHit", "allowedOnly", "noHits", "mentions"] as const;

function tally(results: Result[], key: (typeof CHECKS)[number]) {
  const applicable = results.filter((r) => r[key] !== null);
  return `${applicable.filter((r) => r[key]).length}/${applicable.length}`;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function writeReport(results: Result[], summary: string) {
  const lines = [
    "# Document search eval",
    "",
    `Run on ${new Date().toISOString()} with \`npm run eval\`. Questions: [questions.json](questions.json).`,
    "",
    `**${summary}**`,
    "",
    "| Question | Source hit | Only .gov | No hits | Mentions | Latency |",
    "|---|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| \`${r.q.id}\` ${cell(r.q.question)} | ${mark(r.sourceHit)} | ${mark(r.allowedOnly)} | ${mark(r.noHits)} | ${mark(r.mentions)} | ${(r.ms / 1000).toFixed(1)}s |`
    ),
    "",
    "– means the check does not apply to that question.",
    "",
    "## Results",
    "",
    ...results.flatMap((r) => [
      `### ${r.q.id}`,
      "",
      `> ${r.q.question}`,
      "",
      ...(r.hits.length
        ? r.hits.map((h) => `- ${h.score.toFixed(3)} [${h.title}](${h.url})`)
        : ["_No results._"]),
      "",
    ]),
  ];
  fs.writeFileSync(path.join(DIR, "results.md"), lines.join("\n"));
}

async function main() {
  if (!hasGeminiKey() || !process.env.DATABASE_URL) {
    console.error("GEMINI_API_KEY (or GEMINI_INDEX_API_KEY) and DATABASE_URL must be set in .env.local");
    process.exit(1);
  }

  const results: Result[] = [];
  for (const [i, q] of QUESTIONS.entries()) {
    if (i > 0) await sleep(DELAY_MS);
    const r = await ask(q);
    results.push(r);
    const failed = CHECKS.filter((k) => r[k] === false);
    console.log(`${failed.length ? "FAIL" : "ok  "} ${q.id} (${(r.ms / 1000).toFixed(1)}s)${failed.length ? ": " + failed.join(", ") : ""}`);
  }

  const summary = [
    `Source hit ${tally(results, "sourceHit")}`,
    `Only .gov ${tally(results, "allowedOnly")}`,
    `No hits ${tally(results, "noHits")}`,
    `Mentions ${tally(results, "mentions")}`,
    `median ${(median(results.map((r) => r.ms)) / 1000).toFixed(1)}s`,
  ].join(" · ");

  writeReport(results, summary);
  console.log(`\n${summary}\nWrote scripts/eval/results.md`);
  const anyFailed = results.some((r) => CHECKS.some((k) => r[k] === false));
  // The pg pool keeps the process alive, so exit explicitly.
  process.exit(anyFailed ? 1 : 0);
}

main();
