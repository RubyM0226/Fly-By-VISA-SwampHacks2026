import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import matter from "gray-matter"; //splits corpus into metadata and body text
import { Pool } from "pg"; //connections to tiger data
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local")});

const CORPUS_DIR = path.resolve(process.cwd(), "corpus");
const MIN_CHARS = 800;
const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 4000;
const FORCE = process.argv.includes("--force");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); //talking to gemini

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.delete("sslmode");
const db = new Pool({
    connectionString: dbUrl.toString(),
    ssl: {rejectUnauthorized: false }, //use encrypted connection without verifying certificate
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)); //avoiding overloading geminis rate limits

function chunk(text: string, size = 700, overlap = 100): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  let parts = clean.split(/\n\s*\n/);
  if (parts.length === 1) parts = clean.split("\n");

  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    const piece = p.trim();
    if (!piece) continue;
    if (cur && cur.length + piece.length > size) {
      out.push(cur.trim());
      cur = cur.slice(-overlap);
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

    if (FORCE) await db.query("TRUNCATE chunks");

    let total = 0;
    for (const file of files) {
        const raw = fs.readFileSync(path.join(CORPUS_DIR, file), "utf8");
        const { data, content } = matter(raw); //splits metadata and content

        const title: string = data.title ?? file;
        const savedOn =
            data.saved_on instanceof Date
                ? data.saved_on.toISOString().slice(0, 10)
                : String(data.saved_on);

                if (!FORCE) {
                    const exists = await db.query(
        "SELECT 1 FROM chunks WHERE source_url = $1 AND title = $2 LIMIT 1",
        [data.source_url, title]
      );
      if (exists.rowCount) {
        console.log(`Already indexed ${file}, skipping (use --force to rebuild)`);
        continue;
      }
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
      for (let i = 0; i < pieces.length; i++) {
        await client.query(
          `INSERT INTO chunks (source_url, title, saved_on, content, embedding)
           VALUES ($1, $2, $3, $4, $5::vector)`,
          [data.source_url, title, savedOn, pieces[i], JSON.stringify(vectors[i])]
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

  const { rows } = await db.query("SELECT count(*) FROM chunks");
  console.log(`Done. ${total} new chunks inserted, ${rows[0].count} rows in table.`);
  await db.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});