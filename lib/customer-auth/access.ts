import "server-only";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Invitation checks fail closed, but distinguish service outages from unapproved emails. */
export async function testerAccessStatus(email: string): Promise<"approved" | "not-invited" | "unavailable"> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return "not-invited";
  const db = getSupabaseAdmin();
  if (!db) return "unavailable";
  try {
    const { data, error } = await db.from("early_access_testers")
      .select("active").eq("email", normalized).eq("active", true).maybeSingle();
    if (error) {
      console.error("Early Access invitation lookup unavailable:", error.code || "database-error");
      return "unavailable";
    }
    return data?.active === true ? "approved" : "not-invited";
  } catch {
    console.error("Early Access invitation lookup unavailable: request failed");
    return "unavailable";
  }
}

/** Approved tester emails only. A missing database fails closed. */
export async function isApprovedTesterEmail(email: string): Promise<boolean> {
  return (await testerAccessStatus(email)) === "approved";
}

/** Owner or invited, confirmed member access for account mutations. */
export async function requireCustomerPreviewAccess(): Promise<void> {
  if (process.env.CUSTOMER_ACCOUNTS_PUBLIC === "true") return;
  if (await isAdminAuthenticated()) return;
  const db = await customerSupabase();
  if (!db) redirect("/early-access");
  const { data: { user } } = await db.auth.getUser();
  if (!user?.email || !user.email_confirmed_at || !(await isApprovedTesterEmail(user.email))) {
    redirect("/early-access");
  }
}
