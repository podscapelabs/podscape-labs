import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

await loadLocalEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase admin credentials are required.");

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const records = JSON.parse(await readFile("data/species-records.json", "utf8"));
const contentTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

for (const record of records) {
  if (typeof record.image === "string" && record.image.startsWith("/assets/photos/")) {
    const relativePath = record.image.slice("/assets/photos/".length);
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) throw new Error("Invalid local species photo path.");
    const contentType = contentTypes[path.extname(normalizedPath).toLowerCase()];
    if (contentType) {
      const bytes = await readFile(path.join("public", "assets", "photos", normalizedPath));
      const objectPath = `legacy/${normalizedPath}`;
      const { error: uploadError } = await supabase.storage.from("species-photos").upload(objectPath, bytes, {
        contentType,
        upsert: true,
      });
      if (uploadError) throw uploadError;
      record.image = supabase.storage.from("species-photos").getPublicUrl(objectPath).data.publicUrl;
    }
  }
}

const { error } = await supabase.from("species_records").upsert(
  records.map((record) => ({ id: record.id, slug: record.slug, record, updated_at: record.updatedAt })),
  { onConflict: "id" },
);
if (error) throw error;

console.log(`Migrated ${records.length} species records to Supabase.`);
