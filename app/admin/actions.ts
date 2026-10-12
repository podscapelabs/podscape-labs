"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isLegacyAdminConfigured,
  isValidAdminPassword,
} from "@/lib/admin-auth";
import { authRedirectUrl, createSupabaseAuthClient, getOwnerUser, isAccountLoginConfigured, isOwnerUser } from "@/lib/supabase-auth";

export type AdminLoginState = {
  error: string;
  message?: string;
};

export async function signInAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const authMode = String(formData.get("authMode") || "account");

  if (authMode === "account" && isAccountLoginConfigured()) {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !isOwnerUser(data.user)) {
      if (data.session) await supabase.auth.signOut();
      return { error: "Unable to sign in with those details." };
    }

    redirect("/admin");
  }

  if (!isLegacyAdminConfigured()) return { error: "Owner access has not been configured yet." };

  const password = String(formData.get("password") || "");

  if (!isValidAdminPassword(password)) {
    return { error: "That password is not correct." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function signOutAdmin() {
  if (isAccountLoginConfigured()) {
    const supabase = await createSupabaseAuthClient();
    await supabase.auth.signOut();
  }
  await destroyAdminSession();
  redirect("/admin");
}

export async function requestAdminPasswordReset(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const genericMessage = "If that address belongs to an owner account, a secure reset link is on its way.";
  if (!email || !isAccountLoginConfigured()) return { error: "", message: genericMessage };

  const supabase = await createSupabaseAuthClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl() });
  return { error: "", message: genericMessage };
}

export async function updateAdminPassword(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const owner = await getOwnerUser();
  if (!owner) return { error: "This reset link is no longer valid. Request a new one." };

  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");
  if (password.length < 14) return { error: "Use at least 14 characters." };
  if (password !== confirmation) return { error: "The two passwords do not match." };

  const supabase = await createSupabaseAuthClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "The password could not be updated. Request a new reset link and try again." };

  return { error: "", message: "Password updated. You can return to the Owner Studio." };
}
