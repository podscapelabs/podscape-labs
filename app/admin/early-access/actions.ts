"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getWritableSupabaseAdmin } from "@/lib/supabase-admin";

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase().slice(0, 254);
}

export async function addEarlyAccessTester(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const email = normalizeEmail(formData.get("email"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/admin/early-access?error=invalid");
  try {
    const db = getWritableSupabaseAdmin();
    if (!db) throw new Error("Storage unavailable");
    const { error } = await db.from("early_access_testers").upsert({ email, active: true }, { onConflict: "email" });
    if (error) throw error;
  } catch { redirect("/admin/early-access?error=save"); }
  revalidatePath("/admin/early-access");
  redirect("/admin/early-access?added=1");
}

export async function revokeEarlyAccessTester(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const email = normalizeEmail(formData.get("email"));
  if (!email) redirect("/admin/early-access?error=invalid");
  try {
    const db = getWritableSupabaseAdmin();
    if (!db) throw new Error("Storage unavailable");
    const { error } = await db.from("early_access_testers").update({ active: false }).eq("email", email);
    if (error) throw error;
  } catch { redirect("/admin/early-access?error=save"); }
  revalidatePath("/admin/early-access");
  redirect("/admin/early-access?revoked=1");
}
