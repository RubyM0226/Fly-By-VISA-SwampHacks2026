// Runs the Scam Check rules over the samples in scripts/scam-samples.ts and
// reports precision, recall and every miss. No network or API key needed.
//
//   npx tsx scripts/test-scam.ts            (add --verbose for every result)

import {
  MAX_MESSAGE_CHARS,
  VERDICTS,
  VERDICT_TEXT,
  checkInput,
  checkMessage,
  enforceFloor,
  validateMessage,
} from "../lib/scam";
import { SAMPLES } from "./scam-samples";

const VERBOSE = process.argv.includes("--verbose");

// Prove the rules never touch the network.
globalThis.fetch = (() => {
  throw new Error("Scam Check rules must not use the network");
}) as typeof fetch;

const problems: string[] = [];
let tp = 0, fp = 0, fn = 0, tn = 0;

for (const s of SAMPLES) {
  const valid = validateMessage(s.text);
  if (!valid.ok) {
    problems.push(`${s.id}: sample failed validation (${valid.error})`);
    continue;
  }
  const r = checkMessage(valid.text);
  const flagged = r.verdict !== "cant-tell";
  const ids = r.signals.map((x) => x.id);
  const line = `${s.id} [${s.lang}] -> ${r.verdict} (score ${r.score}) ${ids.join(", ") || "-"}`;

  if (!VERDICTS.includes(r.verdict)) problems.push(`${s.id}: unknown verdict ${r.verdict}`);

  if (s.label === "scam") {
    if (flagged) tp++;
    else fn++;
    const missing = (s.expect ?? []).filter((id) => !ids.includes(id));
    if (!flagged) problems.push(`MISSED SCAM ${line}`);
    else if (missing.length) problems.push(`WRONG REASONS ${line}  missing: ${missing.join(", ")}`);
  } else if (s.label === "benign") {
    if (flagged) {
      fp++;
      problems.push(`FALSE ALARM ${line}`);
      for (const sig of r.signals) problems.push(`    ${sig.id}: ${JSON.stringify(sig.phrases)}`);
    } else tn++;
  }

  if (VERBOSE || s.label === "ambiguous") {
    console.log(`${s.label === "ambiguous" ? "ambiguous  " : "           "}${line}`);
    if (VERBOSE) for (const sig of r.signals) console.log(`             ${sig.id}: ${JSON.stringify(sig.phrases)}`);
  }
}

// We never call anything safe.
for (const v of VERDICTS) {
  const t = VERDICT_TEXT[v];
  const all = [t.label.en, ...t.nextSteps.en].join(" ");
  if (/\bsafe\b/i.test(all)) problems.push(`verdict text for ${v} says "safe"`);
}
if (!VERDICT_TEXT["cant-tell"].nextSteps.en.some((x) => /official/i.test(x))) {
  problems.push(`"cant-tell" must point to the official sites`);
}

// The floor can raise a verdict but never lower it.
const floorCases: [Parameters<typeof enforceFloor>, string][] = [
  [["likely-scam", "cant-tell"], "likely-scam"],
  [["likely-scam", "warning-signs"], "likely-scam"],
  [["warning-signs", "likely-scam"], "likely-scam"],
  [["cant-tell", "warning-signs"], "warning-signs"],
];
for (const [[floor, proposed], want] of floorCases) {
  const got = enforceFloor(floor, proposed);
  if (got !== want) problems.push(`enforceFloor(${floor}, ${proposed}) = ${got}, want ${want}`);
}

// Input checks.
const inputCases: [unknown, string][] = [
  [42, "not-text"],
  ["   ", "empty"],
  ["a".repeat(MAX_MESSAGE_CHARS + 1), "too-long"],
];
for (const [input, want] of inputCases) {
  const got = checkInput(input);
  if (got.ok || got.error !== want) problems.push(`checkInput(${String(input).slice(0, 10)}...) should fail with ${want}`);
}
// Zero-width characters must not hide a phrase.
if (checkMessage("Pay by gift​ card now").verdict !== "likely-scam") {
  problems.push("zero-width characters hid a gift card request");
}

const precision = tp + fp ? tp / (tp + fp) : 1;
const recall = tp + fn ? tp / (tp + fn) : 1;
const counts = { scam: 0, benign: 0, ambiguous: 0 };
for (const s of SAMPLES) counts[s.label]++;

console.log(`\nSamples: ${SAMPLES.length} (${counts.scam} scam, ${counts.benign} benign, ${counts.ambiguous} ambiguous)`);
console.log(`Scams flagged: ${tp}/${tp + fn}   Benign flagged: ${fp}/${fp + tn}`);
console.log(`Precision: ${(precision * 100).toFixed(1)}%   Recall: ${(recall * 100).toFixed(1)}%`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("\nAll checks passed.");
