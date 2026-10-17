// Checks that redact() removes personal details before text goes to an AI.
//
//   npx tsx scripts/test-redact.ts

import { redact } from "../lib/scam";

interface Case {
  name: string;
  input: string;
  /** Must not appear in the output. */
  gone: string[];
  /** Must still appear in the output. */
  kept?: string[];
}

const CASES: Case[] = [
  {
    name: "phone numbers",
    input: "Call +91 98110 45672 or 9876501234 or 011-23456789 now.",
    gone: ["98110", "45672", "9876501234", "23456789"],
    kept: ["Call", "now."],
  },
  {
    name: "emails and UPI handles",
    input: "Write to sharda.sharma68@gmail.com or pay visaexpert@ybl.",
    gone: ["sharda.sharma68", "gmail.com", "visaexpert@ybl"],
    kept: ["[email]", "[payment id]"],
  },
  {
    name: "long digit strings (Aadhaar, account, OTP)",
    input: "Aadhaar 4521 8890 1234, account 004501234567, OTP 482913.",
    gone: ["4521 8890 1234", "004501234567", "482913"],
    kept: ["Aadhaar", "account", "OTP"],
  },
  {
    name: "passport, DS-160 and PAN numbers",
    input: "Passport K1234567, DS-160 AA00ABC123, PAN ABCDE1234F.",
    gone: ["K1234567", "AA00ABC123", "ABCDE1234F"],
    kept: ["Passport", "DS-160", "PAN"],
  },
  {
    name: "names after Dear",
    input: "Dear Sharda Devi, your visa is ready. dear Ramesh, call us. Dear Mrs. Gupta, hello.",
    gone: ["Sharda", "Devi", "Ramesh", "Gupta"],
    kept: ["Dear [name], your visa", "Dear Mrs. [name]"],
  },
  {
    name: "Hindi name after प्रिय",
    input: "प्रिय शारदा जी, आपका वीज़ा तैयार है।",
    gone: ["शारदा"],
    kept: ["प्रिय [name] जी"],
  },
  {
    name: "generic greetings, amounts and dates are kept",
    input: "Dear Customer, pay Rs 25,000 or ₹1,50,000 by 12-11-2026. Wait time 400 days.",
    gone: [],
    kept: ["Dear Customer", "Rs 25,000", "₹1,50,000", "12-11-2026", "400 days"],
  },
];

let failed = 0;
for (const c of CASES) {
  const { text } = redact(c.input);
  const leaks = c.gone.filter((g) => text.includes(g));
  const lost = (c.kept ?? []).filter((k) => !text.includes(k));
  const ok = leaks.length === 0 && lost.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`);
  if (!ok) {
    console.log(`      out:   ${text}`);
    if (leaks.length) console.log(`      leaked: ${leaks.join(" | ")}`);
    if (lost.length) console.log(`      lost:   ${lost.join(" | ")}`);
  }
}

console.log(`\n${CASES.length - failed}/${CASES.length} redaction cases passed.`);
if (failed) process.exit(1);
