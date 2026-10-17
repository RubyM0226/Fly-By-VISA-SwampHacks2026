// Checks the Gemini layer of Scam Check: the rules floor, the fallbacks and
// that only redacted text reaches the model. Uses a fake model by default,
// so it needs no key.
//
//   npx tsx scripts/test-scam-ai.ts           (fake model, offline)
//   npx tsx scripts/test-scam-ai.ts --live    (also runs the samples through real Gemini)

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

import { isStronger, type Verdict } from "../lib/scam";
import type { ScamCheckRequest } from "../lib/scam/api";
import { defaultDeps, runScamCheck, type ScamDeps } from "../lib/scam/service";
import { SAMPLES } from "./scam-samples";

const LIVE = process.argv.includes("--live");
const problems: string[] = [];
const req = (text: string, extra: Partial<ScamCheckRequest> = {}): ScamCheckRequest => ({ text, lang: "en", history: [], ...extra });

/** A fake model that always answers with `verdict`, and remembers what it was sent. */
function fakeModel(verdict: Verdict, summary = "We are not sure. Please check the official .gov pages.") {
  const prompts: string[] = [];
  const deps: ScamDeps = {
    generate: async (_system, prompt) => {
      prompts.push(prompt);
      return JSON.stringify({ kind: "message", verdict, summary, reasons: [], sourceUrls: [] });
    },
    search: null,
  };
  return { deps, prompts };
}

async function main() {
  // 1. The floor: a model that always says "cant-tell" cannot lower any verdict.
  const lenient = fakeModel("cant-tell");
  for (const s of SAMPLES) {
    const r = await runScamCheck(req(s.text), lenient.deps);
    if (isStronger(r.rules.floor, r.verdict)) problems.push(`floor broken on ${s.id}: ${r.rules.floor} -> ${r.verdict}`);
    if (s.label === "scam" && r.verdict === "cant-tell") problems.push(`scam ${s.id} lowered to cant-tell`);
  }

  // 2. The model may raise a verdict.
  const strict = fakeModel("likely-scam");
  const raised = await runScamCheck(req("Ma please call me urgently, need to discuss your visa interview date."), strict.deps);
  if (raised.verdict !== "likely-scam") problems.push(`model could not raise the verdict (got ${raised.verdict})`);

  // 3. Redaction: personal details never reach the model.
  const pii = fakeModel("warning-signs");
  await runScamCheck(
    req("Dear Sharda Devi, call +91 98110 45672 or mail sharda.sharma68@gmail.com. Passport K1234567, Aadhaar 4521 8890 1234.", {
      history: [{ question: "Is 9876501234 their number?", answer: "We cannot tell." }],
      followUp: "My UPI is sharda68@ybl, should I reply?",
    }),
    pii.deps,
  );
  const sent = pii.prompts.join("\n");
  for (const secret of ["Sharda Devi", "98110", "45672", "sharda.sharma68", "K1234567", "4521 8890 1234", "9876501234", "sharda68@ybl"]) {
    if (sent.includes(secret)) problems.push(`"${secret}" was sent to the model`);
  }

  // 4. Fallbacks never throw and say why.
  const noKey = await runScamCheck(req(SAMPLES[0].text), { generate: null, search: null });
  if (noKey.note !== "ai-off" || noKey.verdict !== noKey.rules.verdict) problems.push("missing key did not fall back to rules");
  const broken = await runScamCheck(req(SAMPLES[0].text), {
    generate: async () => {
      throw new Error("network down");
    },
    search: async () => {
      throw new Error("db down");
    },
  });
  if (broken.note !== "ai-failed" || broken.verdict !== "likely-scam") problems.push("failing model did not fall back to rules");
  const garbage = await runScamCheck(req(SAMPLES[0].text), { generate: async () => "not json", search: null });
  if (garbage.note !== "ai-failed") problems.push("bad model output did not fall back to rules");

  // 5. Forbidden wording from the model is dropped.
  const unsafe = fakeModel("cant-tell", "This message looks safe and you will be approved.");
  const u = await runScamCheck(req("Hi Ma, your interview is on Monday."), unsafe.deps);
  if (u.ai?.summary) problems.push(`"safe" summary was shown: ${u.ai.summary}`);

  // 6. The real environment with no key is rules-only.
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const env = await runScamCheck(req(SAMPLES[0].text), defaultDeps());
  if (env.note !== "ai-off") problems.push("defaultDeps() with no GEMINI_API_KEY should be rules-only");
  process.env.GEMINI_API_KEY = saved;

  console.log(`Fake-model checks: ${problems.length === 0 ? "all passed" : `${problems.length} problem(s)`}`);

  if (LIVE) await live();

  if (problems.length) {
    for (const p of problems) console.log("  " + p);
    process.exit(1);
  }
}

/** Every sample through real Gemini, with the floor applied. */
async function live() {
  if (!process.env.GEMINI_API_KEY) {
    problems.push("--live needs GEMINI_API_KEY in .env.local");
    return;
  }
  const deps = defaultDeps();
  let tp = 0, fn = 0, fp = 0, tn = 0, aiUsed = 0;
  for (const s of SAMPLES) {
    // Stay under the free tier's requests-per-minute limit.
    await new Promise((done) => setTimeout(done, 7000));
    const r = await runScamCheck(req(s.text, { lang: s.lang === "hi" ? "hi" : "en" }), deps);
    if (r.ai) aiUsed++;
    const flagged = r.kind === "message" && r.verdict !== "cant-tell";
    const change = r.verdict !== r.rules.verdict ? ` (rules said ${r.rules.verdict})` : "";
    console.log(`  ${s.label.padEnd(9)} ${s.id.padEnd(24)} ${r.kind.padEnd(8)} ${r.verdict}${change}${r.note ? ` [${r.note}]` : ""}`);
    if (r.ai?.summary) console.log(`            ${r.ai.summary.slice(0, 160)}`);
    if (/\bsafe\b/i.test(r.ai?.summary ?? "") && !/\bnot\b.{0,20}\bsafe\b/i.test(r.ai?.summary ?? "")) {
      problems.push(`live: ${s.id} summary uses "safe": ${r.ai?.summary}`);
    }
    if (s.label === "scam") {
      if (flagged) tp++;
      else {
        fn++;
        problems.push(`live: missed scam ${s.id}`);
      }
    }
    if (s.label === "benign") {
      if (!flagged) tn++;
      else {
        fp++;
        problems.push(`live: false alarm ${s.id} -> ${r.verdict}`);
      }
    }
  }
  console.log(`\nLive: AI answered ${aiUsed}/${SAMPLES.length}. Scams flagged ${tp}/${tp + fn}, benign flagged ${fp}/${fp + tn}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
