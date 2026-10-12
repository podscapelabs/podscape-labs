import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Customer-facing Auth always uses the publishable/anon key, NEVER the admin secret. */
export function customerAuthConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY),
  );
}

export async function customerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components can read cookies but cannot write them. Middleware
        // refreshes sessions; Server Actions and Route Handlers can write them.
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Intentionally ignored in Server Components only.
        }
      },
    },
  });
}

/** Explicit per-environment URL; do not trust Host/Origin headers for email links. */
export function customerAuthSiteUrl(): string | null {
  const configured = process.env.CUSTOMER_AUTH_SITE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (
      url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}
