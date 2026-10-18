import fs from "fs";
import path from "path";
import crypto from "crypto";
import seed from "../../data/scam-demo-cache.json";

// Answers for the FAKE sample messages only, saved ahead of the demo.
// The running app only reads this. It never writes a user's message or answer.
const FILE = path.resolve(process.cwd(), "data", "scam-demo-cache.json");
const mem: Record<string, string> = { ...(seed as Record<string, string>) };
const keyOf = (system: string, prompt: string) =>
  crypto.createHash("sha256").update(system + "\n" + prompt).digest("hex");

export function cachedAnswer(system: string, prompt: string): string | null {
  return mem[keyOf(system, prompt)] ?? null;
}

/** Writes only while priming the demo: set SCAM_CACHE_WRITE=1 in your own terminal. */
export function rememberAnswer(system: string, prompt: string, raw: string): void {
  if (process.env.SCAM_CACHE_WRITE !== "1") return;
  try { JSON.parse(raw); } catch { return; } // never save malformed output
  mem[keyOf(system, prompt)] = raw;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(mem, null, 2));
}