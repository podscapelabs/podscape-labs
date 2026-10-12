import "server-only";

import { createClient } from "@supabase/supabase-js";

export function hasSupabaseCredentials() {
  return process.env.PODSCAPE_LOCAL_DATA !== "true" && Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function getSupabaseAdmin() {
  if (process.env.PODSCAPE_LOCAL_DATA === "true") return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getWritableSupabaseAdmin() {
  const supabase = getSupabaseAdmin();
  if (!supabase && process.env.NODE_ENV === "production") {
    throw new Error("Cloud storage is unavailable. Nothing was saved; please try again when the database connection is restored.");
  }
  return supabase;
}
