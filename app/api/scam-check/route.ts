import type { NextRequest } from "next/server";
import { parseRequest, rulesOnlyResponse } from "@/lib/scam/api";
import { defaultDeps, readScreenshot, runScamCheck } from "@/lib/scam/service";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/scam/text";
import { makeLimiter } from "@/lib/rateLimit";
import { sniffType } from "@/lib/uploadsServer";

// POST /api/scam-check, either
//   JSON { text, lang, history, followUp? }, or
//   multipart { text?, lang, image? } (a screenshot: PNG, JPG or WEBP, under 4 MB)
// -> ScamCheckResponse. Errors: { error }.
//
// PRIVACY: the text and the screenshot are checked in memory and never stored
// or logged. A screenshot is sent to Gemini to read its text, then dropped.

const MAX_BODY_CHARS = 16_000;
const rateLimited = makeLimiter(10);

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function POST(request: NextRequest) {
  const deps = defaultDeps();
  const limited = rateLimited(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local");
  let body: unknown;

  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    // Refuse before reading a body that is too big.
    if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 200_000) return fail("image-too-large", 413);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("bad-request", 400);
    }
    const typed = form.get("text");
    let text = typeof typed === "string" ? typed.trim() : "";
    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      if (image.size > MAX_IMAGE_BYTES) return fail("image-too-large", 413);
      const bytes = new Uint8Array(await image.arrayBuffer());
      // The content decides, not the name or the type the browser claims.
      const type = sniffType(bytes);
      if (!type || !(IMAGE_TYPES as readonly string[]).includes(type)) return fail("bad-image", 400);
      if (limited) return fail("rate-limited", 429);
      const read = await readScreenshot(bytes, type, deps);
      if (!read.ok) return fail(read.error, read.error === "image-unavailable" ? 503 : read.error === "no-text" ? 422 : 502);
      text = [text, read.text].filter(Boolean).join("\n\n");
    }
    body = { text, lang: form.get("lang"), history: [] };
  } else {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return fail("too-long", 413);
    try {
      body = JSON.parse(raw);
    } catch {
      return fail("bad-request", 400);
    }
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) return fail(parsed.error, 400);

  if (limited) return Response.json(rulesOnlyResponse(parsed.request.text, "rate-limited"));

  return Response.json(await runScamCheck(parsed.request, deps), {
    headers: { "Cache-Control": "no-store" },
  });
}
