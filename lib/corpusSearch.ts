import { Pool } from "pg";
import { GoogleGenAI } from "@google/genai";

// Semantic search over the official pages in corpus/, indexed into the
// `chunks` table by scripts/index-corpus.ts. Server only: it needs
// GEMINI_API_KEY and DATABASE_URL. The model and size must match the indexer.

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
// Below this cosine similarity a chunk is usually off topic.
const MIN_SCORE = 0.6;

export interface CorpusHit {
  title: string;
  url: string;
  savedOn: string;
  text: string;
  score: number;
}

// Reuse one pool and client across requests (and across dev hot reloads).
const globals = globalThis as unknown as { corpusPool?: Pool; corpusAi?: GoogleGenAI };

function pool(): Pool {
  if (!globals.corpusPool) {
    const dbUrl = new URL(process.env.DATABASE_URL!);
    dbUrl.searchParams.delete("sslmode");
    globals.corpusPool = new Pool({
      connectionString: dbUrl.toString(),
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return globals.corpusPool;
}

/** The shared Gemini client (also used by Scam Check in lib/scam/service.ts). */
export function ai(): GoogleGenAI {
  globals.corpusAi ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return globals.corpusAi;
}

/** Best matching passages first, at most one per page. */
export async function searchCorpus(query: string, limit = 3): Promise<CorpusHit[]> {
  const res = await ai().models.embedContent({
    model: EMBED_MODEL,
    contents: query,
    config: { outputDimensionality: EMBED_DIMS },
  });
  const vector = res.embeddings?.[0]?.values;
  if (!vector) throw new Error("No embedding returned");

  // Take the best chunk from each page, then the best pages overall.
  const { rows } = await pool().query(
    `SELECT title, url, saved_on, content, score FROM (
       SELECT DISTINCT ON (source_url)
              title, source_url AS url, saved_on::text AS saved_on, content,
              1 - (embedding <=> $1::vector) AS score
       FROM chunks
       ORDER BY source_url, embedding <=> $1::vector
     ) best
     WHERE score >= $2
     ORDER BY score DESC
     LIMIT $3`,
    [JSON.stringify(vector), MIN_SCORE, limit]
  );

  return rows.map((r) => ({
    title: r.title,
    url: r.url,
    savedOn: r.saved_on,
    text: r.content,
    score: Number(r.score),
  }));
}
