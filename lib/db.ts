import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in your environment variables.");
}

// Cache connection during development to prevent hot-reload connection leaks
const globalForPostgres = globalThis as unknown as { sql: postgres.Sql };
const sql = globalForPostgres.sql || postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") globalForPostgres.sql = sql;

export default sql;