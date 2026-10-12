import { readFile, readdir } from "node:fs/promises";
import postgres from "postgres";
import { loadLocalEnv } from "./load-local-env.mjs";

await loadLocalEnv();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) throw new Error("POSTGRES_URL_NON_POOLING or POSTGRES_URL is required.");

const sql = postgres(connectionString, { max: 1, prepare: false });

try {
  const migrationNames = (await readdir("supabase/migrations")).filter((name) => name.endsWith(".sql")).sort();
  for (const migrationName of migrationNames) {
    const migration = await readFile(`supabase/migrations/${migrationName}`, "utf8");
    await sql.unsafe(migration);
  }
  console.log("Supabase schema is ready.");
} finally {
  await sql.end();
}
