import { NextResponse, type NextRequest } from "next/server";
import { setCustomerRecoveryPermission } from "@/lib/customer-auth/recovery";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";

/** Fallback for Supabase's standard email templates that redirect with a PKCE code. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const recovery = request.nextUrl.searchParams.get("flow") === "recovery";
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!origin) return new NextResponse("Customer authentication is not configured.", { status: 503 });
  if (!code || !db) return NextResponse.redirect(`${origin}/account/login?status=invalid-link`);

  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/account/login?status=invalid-link`);
  if (recovery) {
    const { data: { user } } = await db.auth.getUser();
    if (!user || !(await setCustomerRecoveryPermission(user.id))) {
      return NextResponse.redirect(`${origin}/account/login?status=configuration`);
    }
    return NextResponse.redirect(`${origin}/account/reset-password`);
  }
  return NextResponse.redirect(`${origin}/account?verified=1`);
}
