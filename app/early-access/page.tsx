import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { isApprovedTesterEmail } from "@/lib/customer-auth/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Member Access | PodScape Labs", robots: { index: false, follow: false } };

/** Preserve old shared invitations while retiring the separate early-access screen. */
export default async function EarlyAccessPage() {
  if (await isAdminAuthenticated()) redirect("/app");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (user?.email && user.email_confirmed_at && await isApprovedTesterEmail(user.email)) redirect("/app");
  redirect("/#member-access");
}
