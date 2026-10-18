import type { NextRequest } from "next/server";
import { askInformation, MAX_ASK_CHARS, MAX_ASK_TURNS, type AskTurn } from "@/lib/ask";
import { makeLimiter } from "@/lib/rateLimit";
import { isLang } from "@/lib/locale";

// POST /api/ask { question, lang, history } -> { result: { answer, sources } | null }
// result is null when the AI helper is off, failed or is busy; the page then
// shows its local answers.
//
// PRIVACY: the question is never stored or logged.

const rateLimited = makeLimiter(10);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_ASK_CHARS) return Response.json({ error: "bad-request" }, { status: 400 });
  const history: AskTurn[] = [];
  for (const t of Array.isArray(body.history) ? body.history.slice(-MAX_ASK_TURNS) : []) {
    if (typeof t?.question !== "string" || typeof t?.answer !== "string") return Response.json({ error: "bad-request" }, { status: 400 });
    history.push({ question: t.question.slice(0, MAX_ASK_CHARS), answer: t.answer.slice(0, MAX_ASK_CHARS) });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const result = rateLimited(ip) ? null : await askInformation(question, history, isLang(body.lang) ? body.lang : "en");
  return Response.json({ result }, { headers: { "Cache-Control": "no-store" } });
}
