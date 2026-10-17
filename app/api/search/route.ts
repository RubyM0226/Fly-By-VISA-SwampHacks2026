import type { NextRequest } from "next/server";
import { searchCorpus } from "@/lib/corpusSearch";

// GET /api/search?q=... -> { hits: CorpusHit[] }
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 300);
  if (q.length < 2) return Response.json({ hits: [] });

  try {
    const hits = await searchCorpus(q);
    return Response.json({ hits });
  } catch (err) {
    console.error("corpus search failed:", err);
    return Response.json({ hits: [], error: "search_failed" }, { status: 502 });
  }
}
