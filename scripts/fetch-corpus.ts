import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

// Downloads the official pages into corpus/*.md, ready for index-corpus.ts.
//   npx tsx scripts/fetch-corpus.ts          all pages
//   npx tsx scripts/fetch-corpus.ts 02 06    only files starting with 02 or 06
// A file is only rewritten when the page text changed, so `git diff corpus/`
// shows exactly what the government changed. Then re-run the indexer.

const CORPUS_DIR = path.resolve(process.cwd(), "corpus");
const MIN_CHARS = 800; // Less than this is an error page, not content.
const PAUSE_MS = 3000; // Be polite: one page every few seconds.
const STALE_DAYS = 30;
const USER_AGENT = "FlyByVisa corpus fetcher (student project; contact via GitHub RubyM0226/Fly-By-VISA-SwampHacks2026)";

type Method =
  | "html" // Plain download.
  | "manual"; // Can't be downloaded by a script: the site blocks it, or the page only
  //              exists after JavaScript runs in a browser. Copy by hand.

interface Source {
  file: string;
  url: string;
  method: Method;
  /** The element holding the content. Default: <main>, else Readability's guess. */
  main?: string;
  /** Extra page-specific parts to drop. */
  drop?: string[];
}

const SOURCES: Source[] = [
  { file: "01-visitor-visa.md", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", method: "manual" },
  { file: "02-extend-stay.md", url: "https://www.uscis.gov/visit-the-united-states/extend-your-stay", method: "html", drop: [".btn-group"] },
  { file: "03-photo-requirements.md", url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html", method: "manual" },
  { file: "04-fees.md", url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html", method: "manual" },
  { file: "05-appointment-wait-times.md", url: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html", method: "manual" },
  {
    file: "06-admission-into-us.md",
    url: "https://www.cbp.gov/travel/international-visitors/applying-admission-united-states",
    method: "html",
    drop: [".usa-form-group", "#usa-accordion-expand-all", "#usa-accordion-close-all", "#related-resources"],
  },
  // Built by JavaScript in the browser, so a plain download is an empty page.
  { file: "07-i94.md", url: "https://i94.cbp.dhs.gov/help", method: "manual" },
  // Embassy site returns 403 to scripts, like travel.state.gov.
  { file: "08-embassy-india-nonimmigrant.md", url: "https://in.usembassy.gov/nonimmigrant-visas/", method: "manual" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const squash = (s: string) => s.replace(/\s+/g, " ").trim();

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced" });
turndown.remove(["script", "style", "noscript", "iframe", "form"]);

// Menus and other page furniture that is never content.
const CHROME = [
  "nav", "aside", "header", "footer", "[role=navigation]", "[class*=breadcrumb]", ".usa-sidenav",
  ".visually-hidden", ".usa-sr-only",
];

async function get(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html", ...headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchPage(src: Source): Promise<{ title: string; body: string }> {
  const html = await get(src.url);
  // Silence jsdom's CSS parse warnings; the pages' stylesheets don't matter here.
  const dom = new JSDOM(html, { url: src.url, virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;
  // Make links absolute ("/i-129" -> "https://www.uscis.gov/i-129") so they work outside the site.
  doc.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", (a as HTMLAnchorElement).href));
  const title = squash(doc.querySelector("h1")?.textContent ?? doc.title);

  // Readability keeps only the "best" block, which drops most of a page built
  // from accordions (like CBP's). The site's own content area is more complete.
  const main = doc.querySelector(src.main ?? "main");
  if (main) {
    main.querySelectorAll([...CHROME, ...(src.drop ?? [])].join(",")).forEach((el) => el.remove());
    // Some FAQs are listed under two topics; keep the first copy.
    const seen = new Set<string>();
    main.querySelectorAll("[id]").forEach((el) => {
      if (seen.has(el.id)) el.remove();
      else seen.add(el.id);
    });
    if (squash(main.textContent ?? "").length >= MIN_CHARS) {
      return { title, body: turndown.turndown(main.innerHTML) };
    }
  }
  if (src.main) throw new Error(`no content found in ${src.main}`);

  const article = new Readability(doc).parse();
  if (!article?.content) throw new Error("Readability found no main content");
  return { title: squash(article.title ?? title), body: turndown.turndown(article.content) };
}

/** Drop images, figure labels and runs of blank lines; links stay readable as text. */
function tidy(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/^\s*[-*]\s+\d+\s*$/gm, "") // list items that are only a number (image callouts)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksBlocked(body: string): boolean {
  return /just a moment|attention required|performing security verification|enable javascript/i.test(body.slice(0, 2000));
}

async function main() {
  const only = process.argv.slice(2);
  const sources = only.length ? SOURCES.filter((s) => only.some((o) => s.file.startsWith(o))) : SOURCES;
  let changed = 0;

  for (const [i, src] of sources.entries()) {
    const file = path.join(CORPUS_DIR, src.file);
    const existing = fs.existsSync(file) ? matter(fs.readFileSync(file, "utf8")) : null;
    const savedOn =
      existing?.data.saved_on instanceof Date
        ? existing.data.saved_on.toISOString().slice(0, 10)
        : existing?.data.saved_on;

    if (src.method === "manual") {
      const age = savedOn ? Math.floor((Date.now() - Date.parse(savedOn)) / 86_400_000) : Infinity;
      if (!existing) console.warn(`MISSING  ${src.file}: copy it by hand from ${src.url}`);
      else if (age > STALE_DAYS) console.warn(`STALE    ${src.file}: copied ${age} days ago, re-copy from ${src.url}`);
      else console.log(`manual   ${src.file}: copied ${savedOn}, OK`);
      continue;
    }

    if (i > 0) await sleep(PAUSE_MS);
    try {
      const page = await fetchPage(src);
      const body = tidy(page.body);
      if (body.length < MIN_CHARS || looksBlocked(body)) {
        console.warn(`BLOCKED  ${src.file}: got ${body.length} chars that look like an error page; kept the old file`);
        continue;
      }
      if (existing && squash(existing.content) === squash(body)) {
        console.log(`same     ${src.file}`);
        continue;
      }
      // Keep a hand-fixed title if there is one.
      const title = existing?.data.title ?? page.title ?? src.file;
      fs.writeFileSync(file, matter.stringify(`\n${body}\n`, { source_url: src.url, title, saved_on: today() }));
      changed++;
      console.log(`UPDATED  ${src.file}: ${body.length} chars`);
    } catch (err) {
      console.warn(`FAILED   ${src.file}: ${(err as Error).message}; kept the old file`);
    }
  }

  console.log(
    changed
      ? `\n${changed} file(s) changed. Check with \`git diff corpus/\`, then run: npx tsx scripts/index-corpus.ts`
      : "\nNo changes."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
