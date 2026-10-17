import { Pool } from "pg";
import { GoogleGenAI } from "@google/genai";

// Semantic search over the official pages in corpus/, indexed into the
// `chunks` table by scripts/index-corpus.ts. Server only: it needs
// GEMINI_API_KEY and DATABASE_URL. The model and size must match the indexer.
// If GEMINI_API_KEY is out of quota, it tries GEMINI_INDEX_API_KEY (a key in a
// separate Google project), then keyword search.

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;
// Below this cosine similarity a chunk is usually off topic.
const MIN_SCORE = 0.6;
// After a key fails, skip it for this long instead of paying a failed call per search.
const KEY_COOLDOWN_MS = 10 * 60_000;

export interface CorpusHit {
  title: string;
  url: string;
  savedOn: string;
  text: string;
  score: number;
}

// Reuse one pool and client across requests (and across dev hot reloads).
const globals = globalThis as unknown as {
  corpusPool?: Pool;
  corpusAi?: Map<string, GoogleGenAI>;
  corpusKeyDownUntil?: Map<string, number>;
};

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

function client(apiKey: string): GoogleGenAI {
  globals.corpusAi ??= new Map();
  let ai = globals.corpusAi.get(apiKey);
  if (!ai) globals.corpusAi.set(apiKey, (ai = new GoogleGenAI({ apiKey })));
  return ai;
}

/** Embeds the query with the first key that works. Throws if none do. */
async function embedQuery(query: string): Promise<number[]> {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_INDEX_API_KEY].filter(
    (k, i, all): k is string => !!k && all.indexOf(k) === i
  );
  globals.corpusKeyDownUntil ??= new Map();
  const downUntil = globals.corpusKeyDownUntil;
  let lastErr: unknown = new Error("no Gemini key configured");

  for (const key of keys) {
    if ((downUntil.get(key) ?? 0) > Date.now()) continue;
    try {
      const res = await client(key).models.embedContent({
        model: EMBED_MODEL,
        contents: query,
        config: { outputDimensionality: EMBED_DIMS },
      });
      const vector = res.embeddings?.[0]?.values;
      if (!vector) throw new Error("No embedding returned");
      return vector;
    } catch (err) {
      lastErr = err;
      downUntil.set(key, Date.now() + KEY_COOLDOWN_MS);
      const name = key === process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "GEMINI_INDEX_API_KEY";
      console.warn(`${name} failed, trying the next option:`, String((err as Error).message ?? err).slice(0, 160));
    }
  }
  throw lastErr;
}

/**
 * Best matching passages first, at most one per page. Uses meaning-based
 * search; if no Gemini key works (for example, both free daily quotas are used
 * up), falls back to keyword search so the page still shows results.
 */
export async function searchCorpus(query: string, limit = 3): Promise<CorpusHit[]> {
  let vector: number[];
  try {
    vector = await embedQuery(query);
  } catch {
    console.warn("no Gemini key available, using keyword search");
    return keywordSearch(query, limit);
  }

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
  return rows.map(toHit);
}

/**
 * Postgres full-text search over the same chunks. Matches any of the words
 * (OR, not AND), ranked by how many match and how close together they are.
 * English only: the pages are in English, so a Hindi query finds nothing here.
 */
async function keywordSearch(query: string, limit: number): Promise<CorpusHit[]> {
  const { rows } = await pool().query(
    `WITH q AS (
       SELECT replace(plainto_tsquery('english', $1)::text, '&', '|')::tsquery AS tsq
     )
     SELECT title, url, saved_on, content, score FROM (
       SELECT DISTINCT ON (source_url)
              title, source_url AS url, saved_on::text AS saved_on, content,
              ts_rank_cd(to_tsvector('english', title || ' ' || content), q.tsq) AS score
       FROM chunks, q
       WHERE q.tsq::text <> '' AND to_tsvector('english', title || ' ' || content) @@ q.tsq
       ORDER BY source_url, score DESC
     ) best
     ORDER BY score DESC
     LIMIT $2`,
    [query, limit]
  );
  // Drop weak single-word matches that ride along behind a good result.
  const hits = rows.map(toHit);
  const top = hits[0]?.score ?? 0;
  return hits.filter((h) => h.score >= 0.3 && h.score >= top * 0.4);
}

function toHit(r: { title: string; url: string; saved_on: string; content: string; score: unknown }): CorpusHit {
  return { title: r.title, url: r.url, savedOn: r.saved_on, text: r.content, score: Number(r.score) };
}
