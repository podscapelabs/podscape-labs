import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Discovery portals are public. Member data and actions have separate guards.
// Never gate the public Ledger, Shop, Fun Zone, Guides, Search or app homepage.
const PRIVATE_AREAS = ["/keeper/", "/api/progress"];

function isPrivateArea(pathname: string): boolean {
  return PRIVATE_AREAS.some((area) => area.endsWith("/") ? pathname.startsWith(area) : pathname === area || pathname.startsWith(area + "/"));
}

/** Allow the existing legacy owner session to review the platform without a member account. */
async function hasLegacyOwnerSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.PODSCAPE_ADMIN_SECRET?.trim();
  const password = process.env.PODSCAPE_ADMIN_PASSWORD?.trim();
  const supplied = request.cookies.get("podscape-owner-session")?.value;
  if (!secret || !password || !supplied) return false;
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", bytes.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, bytes.encode("podscape-owner-preview-v1")));
  const expected = "v1." + Array.from(sig).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Account entry routes must always be reachable, even with stale Supabase cookies.
  // They enforce invitation and password checks in their Server Actions.
  if (pathname === "/account/login" || pathname === "/account/sign-up") {
    return NextResponse.next();
  }
  const protectedPage = isPrivateArea(pathname);
  // Public portal routes are never redirected, but still refresh Supabase cookies.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });
  if (!url || !key) {
    if (protectedPage && !(await hasLegacyOwnerSession(request))) return NextResponse.redirect(new URL("/#member-access", request.url));
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!protectedPage) return response;
  if (user?.app_metadata?.role === "owner" || await hasLegacyOwnerSession(request)) return response;

  if (user?.email && user.email_confirmed_at) {
    // The invitation list is intentionally not readable by public/member roles.
    // Check with a separate server-side service client; never expose this key to the browser.
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const admin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await admin.from("early_access_testers")
        .select("active").eq("email", user.email.trim().toLowerCase()).eq("active", true).maybeSingle();
      if (!error && data?.active) return response;
    }
  }

  const destination = new URL("/early-access", request.url);
  // Never redirect directly to arbitrary URLs. This route is informational.
  const redirectResponse = NextResponse.redirect(destination);
  for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|css|js)$).*)"],
};
