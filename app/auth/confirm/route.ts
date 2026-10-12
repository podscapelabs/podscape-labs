import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { setCustomerRecoveryPermission } from "@/lib/customer-auth/recovery";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token_hash = params.get("token_hash");
  const type = params.get("type");
  const appUrl = customerAuthSiteUrl();
  if (!appUrl) return new NextResponse("Customer authentication is not configured.", { status: 503 });
  const db = await customerSupabase();

  // Only support the two flows this application actually uses.
  if (!token_hash || !type || !["email", "signup", "recovery"].includes(type) || !db) {
    return NextResponse.redirect(`${appUrl}/account/login?status=invalid-link`);
  }

  const { error, data } = await db.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
  if (error) return NextResponse.redirect(`${appUrl}/account/login?status=invalid-link`);

  if (type === "recovery") {
    if (!data.user || !(await setCustomerRecoveryPermission(data.user.id))) {
      return NextResponse.redirect(`${appUrl}/account/login?status=configuration`);
    }
    return NextResponse.redirect(`${appUrl}/account/reset-password`);
  }
  return NextResponse.redirect(`${appUrl}/account?verified=1`);
}
