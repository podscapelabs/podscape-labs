"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";
import { clearCustomerRecoveryPermission, hasCustomerRecoveryPermission } from "@/lib/customer-auth/recovery";

export type CustomerFormState = { error: string; message: string };

function stringField(form: FormData, key: string, maxLength = 254): string {
  return String(form.get(key) || "").trim().slice(0, maxLength);
}

function emailFrom(form: FormData): string {
  return stringField(form, "email").toLowerCase();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passwordFrom(form: FormData): string {
  return String(form.get("password") || "");
}

function validNewPassword(password: string): boolean {
  return password.length >= 12 && password.length <= 128;
}

export async function signUpCustomer(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!db || !origin) return { error: "Customer registration is not configured yet.", message: "" };

  const email = emailFrom(form);
  const password = passwordFrom(form);
  const confirmation = String(form.get("confirmPassword") || "");
  const displayName = stringField(form, "displayName", 60);
  if (!validEmail(email)) return { error: "Enter a valid email address.", message: "" };
  if (!validNewPassword(password)) return { error: "Use a password of 12–128 characters.", message: "" };
  if (password !== confirmation) return { error: "Your passwords do not match.", message: "" };

  const { error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { display_name: displayName },
    },
  });
  if (error) {
    // Avoid disclosing whether an address is registered.
    if (/already|registered|exists/i.test(error.message)) {
      return { error: "", message: "If that address is eligible, check your inbox for the next step." };
    }
    return { error: "We could not complete registration. Please try again.", message: "" };
  }
  // Do not rely on unconfirmed signup sessions. Confirmation must be enabled in Supabase.
  await db.auth.signOut();
  return { error: "", message: "Check your inbox for your confirmation link before signing in." };
}

export async function signInCustomer(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  if (!db) return { error: "Customer sign-in is not configured yet.", message: "" };
  const email = emailFrom(form);
  const password = passwordFrom(form);
  if (!validEmail(email) || !password) return { error: "Enter your email and password.", message: "" };
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid credentials or unverified email. Please try again.", message: "" };
  redirect("/account");
}

export async function requestCustomerPasswordReset(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!db || !origin) return { error: "Password recovery is not configured yet.", message: "" };
  const email = emailFrom(form);
  if (!validEmail(email)) return { error: "Enter a valid email address.", message: "" };
  await db.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?flow=recovery` });
  // Always return an identical response, whether or not the account exists.
  return { error: "", message: "If an account exists for that email, a reset link is on its way." };
}

export async function changeCustomerPassword(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  if (!db) return { error: "Customer sign-in is not configured yet.", message: "" };
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user || !(await hasCustomerRecoveryPermission(user.id))) {
    return { error: "Your reset link has expired. Request a new one.", message: "" };
  }
  const password = passwordFrom(form);
  const confirmation = String(form.get("confirmPassword") || "");
  if (!validNewPassword(password)) return { error: "Use a password of 12–128 characters.", message: "" };
  if (password !== confirmation) return { error: "Your passwords do not match.", message: "" };
  const { error } = await db.auth.updateUser({ password });
  if (error) return { error: "Unable to update the password. Request a new link and try again.", message: "" };
  await clearCustomerRecoveryPermission();
  await db.auth.signOut();
  return { error: "", message: "Password updated. You can now sign in with it." };
}

export async function updateCustomerProfile(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  if (!db) return { error: "Customer profiles are not configured yet.", message: "" };
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "Please sign in again.", message: "" };
  const displayName = stringField(form, "displayName", 60);
  const { error } = await db.from("customer_profiles").update({ display_name: displayName }).eq("id", user.id).select("id").single();
  if (error) return { error: "Could not save your profile. Please try again.", message: "" };
  revalidatePath("/account");
  return { error: "", message: "Profile updated." };
}

export async function signOutCustomer() {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  if (db) await db.auth.signOut();
  await clearCustomerRecoveryPermission();
  redirect("/account/login");
}
