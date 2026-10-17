import type { NextRequest } from "next/server";
import { parseRequest, rulesOnlyResponse } from "@/lib/scam/api";
import { defaultDeps, runScamCheck } from "@/lib/scam/service";

// POST /api/scam-check { text, lang, history, followUp? } -> ScamCheckResponse
//
// PRIVACY: the text is checked in memory and never stored or logged.

const MAX_BODY_CHARS = 16_000;

// Basic per-address limit, in memory (resets on deploy; good enough for a demo).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return Response.json({ error: "too-long" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const parsed = parseRequest(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) return Response.json(rulesOnlyResponse(parsed.request.text, "rate-limited"));

  return Response.json(await runScamCheck(parsed.request, defaultDeps()), {
    headers: { "Cache-Control": "no-store" },
  });
}
