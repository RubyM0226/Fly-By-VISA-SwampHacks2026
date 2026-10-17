import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.delete("sslmode");
const db = new Pool({
    connectionString: dbUrl.toString(),
    ssl: { rejectUnauthorized: false},
});

async function main() {
    const question = process.argv[2];

    const res = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: question,
        config: { outputDimensionality: 768 },
    });

  const { rows } = await db.query(
    `SELECT title,
            round((1 - (embedding <=> $1::vector))::numeric, 3) AS score,
            left(replace(content, E'\\n', ' '), 140) AS snippet
     FROM chunks
     ORDER BY embedding <=> $1::vector
     LIMIT 5`,
    [JSON.stringify(res.embeddings![0].values)]
  );

  console.log(`\nQ: ${question}`);
  console.table(rows);
  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });