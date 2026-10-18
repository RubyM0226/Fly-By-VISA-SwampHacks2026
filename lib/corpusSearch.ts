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
const MIN_SCORE = 0.61;
// Short queries ("passport") carry too little meaning for the embedding on its
// own, so they score about the same against every chunk that mentions the
// word. Asking the full question in the app's context ranks the right
// sections first. Expanded scores run higher, so they get their own cutoff.
const SHORT_QUERY_WORDS = 3;
const PER_PAGE = 2;
const MIN_SCORE_EXPANDED = 0.65;
const expand = (q: string) => `What does someone applying for a U.S. B-2 visitor visa need to know about: ${q}`;

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

/** Env variables holding Gemini keys, tried in order. */
export type GeminiKeyName = "GEMINI_SCAM_API_KEY" | "GEMINI_API_KEY" | "GEMINI_INDEX_API_KEY";
const DEFAULT_KEYS: GeminiKeyName[] = ["GEMINI_API_KEY", "GEMINI_INDEX_API_KEY"];

/** True if any of `names` (by default GEMINI_API_KEY or GEMINI_INDEX_API_KEY) is set. */
export function hasGeminiKey(names: GeminiKeyName[] = DEFAULT_KEYS): boolean {
  return names.some((n) => !!process.env[n]);
}

type FailKind = "daily" | "minute" | "transient" | "auth" | "fatal";

// Reads the error message to classify it, but never logs it (it can echo the request).
function classify(err: unknown): { kind: FailKind; retryMs?: number } {
  const e = err as { status?: unknown; message?: unknown };
  const status = typeof e?.status === "number" ? e.status : undefined;
  const msg = typeof e?.message === "string" ? e.message : "";
  if (status === 429 || msg.includes("RESOURCE_EXHAUSTED")) {
    if (/PerDay/i.test(msg)) return { kind: "daily" };
    const m = /retry in ([\d.]+)s/i.exec(msg) ?? /"retryDelay":\s*"(\d+)s"/.exec(msg);
    return { kind: "minute", retryMs: m ? Math.ceil(Number(m[1]) * 1000) + 500 : undefined };
  }
  if (status === 401 || status === 403 || /API key/i.test(msg)) return { kind: "auth" };
  if (status === 400 || status === 404) return { kind: "fatal" };
  return { kind: "transient" }; // 500 / 503 / 504, network errors, anything unknown
}

// Google documents daily quotas as resetting at midnight Pacific; verify in their docs.
function msUntilMidnightPT(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  }).formatToParts(new Date());
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const elapsed = ((n("hour") * 60 + n("minute")) * 60 + n("second")) * 1000;
  return 24 * 3600_000 - elapsed + 1000;
}

const sleepAbortable = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new Error("aborted"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason ?? new Error("aborted")); }, { once: true });
  });

const TRANSIENT_TRIES = 2; // keep low: the scam check has a 15 s timeout

/**
 * Runs `call` with each key in `names` until one works (by default
 * GEMINI_API_KEY, then GEMINI_INDEX_API_KEY). Throws the last error if no key
 * works. Also used by Scam Check in lib/scam/service.ts, which tries
 * GEMINI_SCAM_API_KEY first. `model` scopes the cooldown: quotas are per
 * model, so a key out of embedding quota may still generate. Pass `signal` so
 * a timeout stops here instead of trying (and cooling down) the next key.
 */
export async function withGemini<T>(
  model: string,
  call: (ai: GoogleGenAI) => Promise<T>,
  signal?: AbortSignal,
  names: GeminiKeyName[] = DEFAULT_KEYS
): Promise<T> {
  const keys = names
    .map((name) => ({ name, key: process.env[name] }))
    .filter((k, i, all): k is { name: GeminiKeyName; key: string } => !!k.key && all.findIndex((o) => o.key === k.key) === i);
  globals.corpusKeyDownUntil ??= new Map();
  const downUntil = globals.corpusKeyDownUntil;
  let lastErr: unknown;
  let tried = 0;

  for (const { name, key } of keys) {
    const slot = `${model}:${key}`;
    if ((downUntil.get(slot) ?? 0) > Date.now()) continue;

    for (let attempt = 1; attempt <= TRANSIENT_TRIES; attempt++) {
      tried++;
      try {
        return await call(client(key));
      } catch (err) {
        // Out of time: the key is fine, and there is no time left for the next one.
        if (signal?.aborted) throw err;
        lastErr = err;
        const { kind, retryMs } = classify(err);
        const status = (err as { status?: unknown }).status;
        // Name, status and kind only: Scam Check errors can echo the (redacted) request.
        console.warn(`${name} failed (${(err as Error).name ?? "error"}${typeof status === "number" ? " " + status : ""}) [${kind}]`);

        if (kind === "fatal") throw err; // a bad request fails on every key
        if (kind === "transient" && attempt < TRANSIENT_TRIES) {
          await sleepAbortable(1500, signal); // retry the SAME key, no cooldown
          continue;
        }
        if (kind === "daily") downUntil.set(slot, Date.now() + msUntilMidnightPT());
        else if (kind === "minute") downUntil.set(slot, Date.now() + Math.min(retryMs ?? KEY_COOLDOWN_MS, 65_000));
        else if (kind === "auth") downUntil.set(slot, Date.now() + 3600_000);
        break; // next key
      }
    }
  }

  if (tried > 0) throw lastErr;
  // Nothing was tried: say why, instead of the old misleading placeholder.
  throw Object.assign(
    new Error(keys.length ? "all Gemini keys are cooling down" : "no Gemini key configured"),
    keys.length ? { status: 429 } : {}
  );
}

/** Embeds the query with the first key that works. Throws if none do. */
async function embedQuery(query: string): Promise<number[]> {
  return withGemini(EMBED_MODEL, async (ai) => {
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: query,
      config: { outputDimensionality: EMBED_DIMS },
    });
    const vector = res.embeddings?.[0]?.values;
    if (!vector) throw new Error("No embedding returned");
    return vector;
  });
}

/**
 * Best matching passages first, at most one per page. Uses meaning-based
 * search; if no Gemini key works (for example, both free daily quotas are used
 * up), falls back to keyword search so the page still shows results.
 */
export async function searchCorpus(query: string, limit = 4): Promise<CorpusHit[]> {
  // Expanding makes every query look on topic ("...visa need to know about: pizza"),
  // so only expand when the words actually appear in the official pages.
  const short = query.trim().split(/\s+/).length <= SHORT_QUERY_WORDS;
  const expanded = short && (await mentionedInCorpus(query));

  let vector: number[];
  try {
    vector = await embedQuery(expanded ? expand(query) : query);
  } catch {
    console.warn("no Gemini key available, using keyword search");
    return keywordSearch(query, limit);
  }

  // Best chunks overall, at most PER_PAGE from any one page: a page can show two
  // close matches (passport validity and expired passports), but one big page
  // can't fill the list. An expanded query only keeps chunks that mention one of
  // its words: the added context ("B-2 visitor visa") otherwise pulls in general
  // visa passages.
  const { rows } = await pool().query(
    `SELECT title, url, saved_on, content, score FROM (
       SELECT title, source_url AS url, saved_on::text AS saved_on, content,
              1 - (embedding <=> $1::vector) AS score,
              row_number() OVER (PARTITION BY source_url ORDER BY embedding <=> $1::vector) AS rank_in_page
       FROM chunks
       WHERE NOT $4::boolean OR ${DOC_TEXT} @@ ${anyWord("$5")}
     ) ranked
     WHERE score >= $2 AND rank_in_page <= $6
     ORDER BY score DESC
     LIMIT $3`,
    [JSON.stringify(vector), expanded ? MIN_SCORE_EXPANDED : MIN_SCORE, limit, expanded, query, PER_PAGE]
  );
  return rows.map(toHit);
}

/** Matches any of the query's words, English stemming ("fees" -> "fee"). */
const anyWord = (param: string) => `replace(plainto_tsquery('english', ${param})::text, '&', '|')::tsquery`;
const ANY_WORD = anyWord("$1");
const DOC_TEXT = `to_tsvector('english', title || ' ' || content)`;

/** True if any (non-filler) word of the query appears in some chunk. */
async function mentionedInCorpus(query: string): Promise<boolean> {
  const { rowCount } = await pool().query(
    `WITH q AS (SELECT ${ANY_WORD} AS tsq)
     SELECT 1 FROM chunks, q WHERE q.tsq::text <> '' AND ${DOC_TEXT} @@ q.tsq LIMIT 1`,
    [query]
  );
  return !!rowCount;
}

/**
 * Postgres full-text search over the same chunks. Matches any of the words
 * (OR, not AND), ranked by how many match and how close together they are.
 * English only: the pages are in English, so a Hindi query finds nothing here.
 */
async function keywordSearch(query: string, limit: number): Promise<CorpusHit[]> {
  const { rows } = await pool().query(
    `WITH q AS (SELECT ${ANY_WORD} AS tsq)
     SELECT title, url, saved_on, content, score FROM (
       SELECT DISTINCT ON (source_url)
              title, source_url AS url, saved_on::text AS saved_on, content,
              ts_rank_cd(${DOC_TEXT}, q.tsq) AS score
       FROM chunks, q
       WHERE q.tsq::text <> '' AND ${DOC_TEXT} @@ q.tsq
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
