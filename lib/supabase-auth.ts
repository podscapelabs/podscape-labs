import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function authUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

function authKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || "";
}

export function isAccountLoginConfigured() {
  return Boolean(authUrl() && authKey());
}

export function isOwnerUser(user: User | null | undefined) {
  return Boolean(user && user.app_metadata?.role === "owner");
}

export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(authUrl(), authKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Middleware refreshes them.
        }
      },
    },
  });
}

export async function getOwnerUser() {
  if (!isAccountLoginConfigured()) return null;
  const supabase = await createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerUser(data.user)) return null;
  return data.user;
}

export function authRedirectUrl() {
  const base = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.NODE_ENV === "production" ? "https://podscapelabs.com" : "http://localhost:3102");
  return `${base.replace(/\/$/, "")}/auth/callback?next=/admin/reset-password`;
}
