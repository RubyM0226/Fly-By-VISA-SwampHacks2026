import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import matter from "gray-matter"; //splits corpus into metadata and body text
import { Pool } from "pg"; //connections to tiger data
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local")});

const CORPUS_DIR = path.resolve(process.cwd(), "corpus");
const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 4000;
const FORCE = process.argv.includes("--force");
// Bump when chunk() changes, so every page is re-chunked on the next run.
const CHUNK_VERSION = 3;

// Indexing has its own key (in a separate Google project) so re-indexing can't use up
// the daily quota the website's search needs. Falls back to the site's key if unset.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_INDEX_API_KEY || process.env.GEMINI_API_KEY }); //talking to gemini
console.log(`Embedding with ${process.env.GEMINI_INDEX_API_KEY ? "GEMINI_INDEX_API_KEY" : "GEMINI_API_KEY (no GEMINI_INDEX_API_KEY set)"}`);

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.delete("sslmode");
const db = new Pool({
    connectionString: dbUrl.toString(),
    ssl: {rejectUnauthorized: false }, //use encrypted connection without verifying certificate
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)); //avoiding overloading geminis rate limits

const HEADINGS = /^(?:#{1,6} .*(?:\n+|$))+/;

/**
 * Splits markdown at headings, so a chunk never mixes two sections. A heading
 * with nothing under it ("## Related Links" right before "### Forms") joins
 * the next section. Returns each section's heading lines and its body.
 */
function sections(text: string): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  let pending = "";
  for (const raw of text.split(/\n(?=#{1,6} )/)) {
    const sec = (pending + raw).trim();
    const heading = sec.match(HEADINGS)?.[0].trim() ?? "";
    const body = sec.slice(heading.length).trim();
    if (!body) {
      pending = heading ? `${heading}\n\n` : "";
      continue;
    }
    pending = "";
    out.push({ heading, body });
  }
  return out;
}

function chunk(text: string, size = 700, overlap = 100): string[] {
  const out: string[] = [];
  for (const { heading, body } of sections(text.replace(/\r\n/g, "\n").trim())) {
    // Repeat the section heading on every chunk of that section, for context.
    for (const piece of pack(body, size, overlap)) {
      out.push(heading ? `${heading}\n\n${piece}` : piece);
    }
  }
  return out;
}

function pack(clean: string, size: number, overlap: number): string[] {
  let parts = clean.split(/\n\s*\n/);
  if (parts.length === 1) parts = clean.split("\n");

  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    const piece = p.trim();
    if (!piece) continue;
    // Never close a chunk that is only a short lead-in ("Bring these documents:");
    // let it run long so the list stays with it.
    if (cur.length >= 200 && cur.length + piece.length > size) {
      out.push(cur.trim());
      // Carry the last few words over, starting at a whole word.
      const tail = cur.slice(-overlap);
      cur = tail.slice(tail.search(/\s/) + 1);
    }
    cur += (cur ? "\n\n" : "") + piece;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function embedBatch(texts: string[]) : Promise<number[][]> {
    for (let attempt = 1; attempt <= 6; attempt++) {
        try {
            const res = await ai.models.embedContent({
                model: "gemini-embedding-001",
                contents: texts,
                config: { outputDimensionality: 768 },
            });
            const vectors = (res.embeddings ?? []).map((e) => e.values!);
            if (vectors.length !== texts.length) {
                throw new Error(`Expected ${texts.length} embeddings, got ${vectors.length}`);
            } 
            return vectors;
        } catch (err) {
            const msg = String((err as Error).message ?? err);
            const rateLimited = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
            const wait = rateLimited ? 20000 * attempt : 2000 * attempt;
            console.warn(
                `   embed failed (attempt ${attempt}/6${rateLimited ? " - rate limit" : ""}; waiting ${wait / 1000}s)`
            );
            if (!rateLimited) console.warn(" ", msg.slice(0, 200));
            await sleep(wait);
        }
    }
    throw new Error("Embedding failed after 6 attempts");
}

async function main() {
    if (!fs.existsSync(CORPUS_DIR)) {
        throw new Error(`Corpus folder now found: ${CORPUS_DIR}`);
    }

    const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".md")).sort();
    console.log(`Found ${files.length} files in ${CORPUS_DIR}${FORCE ? " (FORCE: rebuilding all)" : ""}`);

    // Remembers which version of each page was embedded, so changed pages get re-indexed.
    await db.query("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_hash text");
    if (FORCE) await db.query("TRUNCATE chunks");

    const indexedUrls = new Set<string>();

    let total = 0;
    for (const file of files) {
        const raw = fs.readFileSync(path.join(CORPUS_DIR, file), "utf8");
        const { data, content } = matter(raw); //splits metadata and content

        const title: string = data.title ?? file;
        const savedOn =
            data.saved_on instanceof Date
                ? data.saved_on.toISOString().slice(0, 10)
                : String(data.saved_on);

    if (!data.source_url) {
      console.warn(`SKIPPING ${file}: no source_url in its header`);
      continue;
    }
    indexedUrls.add(data.source_url);

    const hash = crypto.createHash("sha256").update(`${CHUNK_VERSION}\n${title}\n${content}`).digest("hex");
    const same = await db.query(
      "SELECT 1 FROM chunks WHERE source_url = $1 AND content_hash = $2 LIMIT 1",
      [data.source_url, hash]
    );
    if (same.rowCount) {
      console.log(`Unchanged ${file}, skipping`);
      continue;
    }

    const pieces = chunk(content);
    if (pieces.length === 0) {
      console.warn(`SKIPPING ${file}: 0 pieces`);
      continue;
    }
    console.log(`${file}: ${content.length} chars -> ${pieces.length} chunks, embedding...`);

    const vectors: number[][] = [];
    for (let i = 0; i < pieces.length; i += BATCH_SIZE) {
      const batch = pieces.slice(i, i + BATCH_SIZE);
      vectors.push(...(await embedBatch(batch)));
      await sleep(BATCH_PAUSE_MS);
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      // Replace this page's old version, if any.
      await client.query("DELETE FROM chunks WHERE source_url = $1", [data.source_url]);
      for (let i = 0; i < pieces.length; i++) {
        await client.query(
          `INSERT INTO chunks (source_url, title, saved_on, content, embedding, content_hash)
           VALUES ($1, $2, $3, $4, $5::vector, $6)`,
          [data.source_url, title, savedOn, pieces[i], JSON.stringify(vectors[i]), hash]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    total += pieces.length;
    console.log(`Indexed ${file}: ${pieces.length} chunks`);
  }

  // Drop pages whose file was deleted or whose source_url changed.
  // (Never with an empty list: that would wipe the table.)
  if (indexedUrls.size > 0) {
    const removed = await db.query("DELETE FROM chunks WHERE NOT (source_url = ANY($1))", [[...indexedUrls]]);
    if (removed.rowCount) console.log(`Removed ${removed.rowCount} chunks from pages no longer in corpus/`);
  }

  const { rows } = await db.query("SELECT count(*) FROM chunks");
  console.log(`Done. ${total} new chunks inserted, ${rows[0].count} rows in table.`);
  await db.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});