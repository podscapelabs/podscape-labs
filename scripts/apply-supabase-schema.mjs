import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { loadLocalEnv } from "./load-local-env.mjs";

await loadLocalEnv();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("POSTGRES_URL_NON_POOLING or POSTGRES_URL is required.");

const migration = await readFile("supabase/migrations/0001_species_records.sql", "utf8");
const sql = postgres(connectionString, { max: 1, prepare: false });

try {
  await sql.unsafe(migration);
  console.log("Supabase schema is ready.");
} finally {
  await sql.end();
}
