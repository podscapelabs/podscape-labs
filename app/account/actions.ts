"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isApprovedTesterEmail, testerAccessStatus, requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";
import { clearCustomerRecoveryPermission, hasCustomerRecoveryPermission } from "@/lib/customer-auth/recovery";

export type CustomerFormState = { error: string; message: string };

function stringField(form: FormData, key: string, maxLength = 254): string {
  return String(form.get(key) || "").trim().slice(0, maxLength);
}

function emailFrom(form: FormData): string {
  return stringField(form, "email").toLowerCase();
}

function validUsername(value: string): boolean {
  return /^[A-Za-z0-9_]{3,24}$/.test(value);
}

async function usernameAvailable(db: NonNullable<Awaited<ReturnType<typeof customerSupabase>>>, username: string): Promise<boolean | null> {
  const { data, error } = await db.rpc("is_customer_username_available", { p_username: username });
  return error ? null : data === true;
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
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!db || !origin) return { error: "Customer registration is not configured yet.", message: "" };

  const email = emailFrom(form);
  const password = passwordFrom(form);
  const confirmation = String(form.get("confirmPassword") || "");
  const displayName = stringField(form, "displayName", 24);
  if (!validUsername(displayName)) return { error: "Choose a username of 3–24 letters, numbers or underscores. Spaces are not allowed.", message: "" };
  if (!validEmail(email)) return { error: "Enter a valid email address.", message: "" };
  if (!(await isAdminAuthenticated())) {
    const approval = await testerAccessStatus(email);
    if (approval === "unavailable") return { error: "Early Access verification is temporarily unavailable. Please try again shortly.", message: "" };
    if (approval !== "approved") return { error: "This email is not yet on the Early Access list. Ask the PodScape team to approve it first.", message: "" };
  }
  const available = await usernameAvailable(db, displayName);
  if (available === null) return { error: "Username availability could not be checked. Please try again.", message: "" };
  if (!available) return { error: "That username is already taken. Please choose another.", message: "" };
  if (!validNewPassword(password)) return { error: "Use a password of 12–128 characters.", message: "" };
  if (password !== confirmation) return { error: "Your passwords do not match.", message: "" };

  const { error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/customer-callback`,
      data: { display_name: displayName },
    },
  });
  if (error) {
    // Avoid disclosing whether an address is registered.
    if (/already|registered|exists/i.test(error.message)) {
      return { error: "", message: "If that address is eligible, check your inbox for the next step." };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { error: "PodScape verification emails are temporarily at capacity. Please try again later, or contact the PodScape team. Repeated attempts will not help.", message: "" };
    }
    if (error.code === "email_address_not_authorized") {
      return { error: "Verification emails are temporarily unavailable. Please contact the PodScape team.", message: "" };
    }
    return { error: "We could not complete registration. Please try again later or contact the PodScape team.", message: "" };
  }
  // Do not rely on unconfirmed signup sessions. Confirmation must be enabled in Supabase.
  await db.auth.signOut();
  return { error: "", message: "Check your inbox for your confirmation link before signing in." };
}

/** Re-send signup confirmation without bypassing the beta invitation gate. */
export async function resendCustomerVerification(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!db || !origin) return { error: "Email verification is temporarily unavailable. Please try later.", message: "" };
  const email = emailFrom(form);
  if (!validEmail(email)) return { error: "Enter a valid email address.", message: "" };

  // Only previously approved beta testers can request confirmation mail.
  if (!(await isAdminAuthenticated())) {
    const approval = await testerAccessStatus(email);
    if (approval === "unavailable") return { error: "Early Access verification is temporarily unavailable. Please try again shortly.", message: "" };
    if (approval !== "approved") return { error: "This email is not yet approved for Early Access. Contact the PodScape team.", message: "" };
  }

  const { error } = await db.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/customer-callback` },
  });
  if (error?.status === 429 || error?.code === "over_email_send_rate_limit") {
    return { error: "Please wait before requesting another verification email. Supabase is limiting email requests temporarily.", message: "" };
  }
  if (error) {
    // Do not expose whether a user account exists.
    return { error: "", message: "If your account needs verification, a new confirmation email will arrive shortly. Check your spam folder too." };
  }
  return { error: "", message: "If your account needs verification, a new confirmation email is on its way. Check your spam folder too." };
}

export async function signInCustomer(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const db = await customerSupabase();
  if (!db) return { error: "Customer sign-in is not configured yet.", message: "" };
  const email = emailFrom(form);
  const password = passwordFrom(form);
  if (!validEmail(email) || !password) return { error: "Enter your email and password.", message: "" };
  const { error, data } = await db.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid credentials or unverified email. Please try again.", message: "" };
  if (data.user?.app_metadata?.role === "owner") redirect("/app");
  // Never trust the address submitted in the form as the approval identity.
  // Only an authenticated, confirmed account with an active invitation may enter.
  const verifiedEmail = data.user?.email_confirmed_at ? data.user.email?.trim().toLowerCase() : "";
  const approval = verifiedEmail ? await testerAccessStatus(verifiedEmail) : "not-invited";
  if (approval !== "approved") {
    await db.auth.signOut();
    return { error: approval === "unavailable"
      ? "Early Access verification is temporarily unavailable. Please try again shortly."
      : "This account is not approved for Early Access. Contact the PodScape team.", message: "" };
  }
  redirect("/app");
}

export async function requestCustomerPasswordReset(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const db = await customerSupabase();
  const origin = customerAuthSiteUrl();
  if (!db || !origin) return { error: "Password recovery is not configured yet.", message: "" };
  const email = emailFrom(form);
  if (!validEmail(email)) return { error: "Enter a valid email address.", message: "" };
  await db.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/customer-callback?flow=recovery` });
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
  const displayName = stringField(form, "displayName", 24);
  if (!validUsername(displayName)) return { error: "Choose a username of 3–24 letters, numbers or underscores.", message: "" };
  const {data: current, error: lookupError}=await db.from("customer_profiles").select("display_name").eq("id",user.id).maybeSingle();
  if(lookupError||!current)return { error:"Unable to load your current username. Please try again.", message:"" };
  if(current.display_name.toLowerCase()!==displayName.toLowerCase()){
    const available=await usernameAvailable(db,displayName);
    if(available===null)return {error:"Username availability could not be checked. Please try again.",message:""};
    if(!available)return {error:"That username is already taken. Please choose another.",message:""};
  }
  const { error } = await db.from("customer_profiles").update({ display_name: displayName }).eq("id", user.id).select("id").single();
  if (error?.code === "23505") return { error: "That username is already taken. Please choose another.", message: "" };
  if (error) return { error: "Could not save your username. Please try again.", message: "" };
  revalidatePath("/account");
  return { error: "", message: "Username saved." };
}

export async function signOutCustomer() {
  const db = await customerSupabase();
  if (db) await db.auth.signOut();
  await clearCustomerRecoveryPermission();
  redirect("/account/login");
}

/** Require the current password before allowing a signed-in password change. */
export async function changeAuthenticatedCustomerPassword(_prev: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  await requireCustomerPreviewAccess();
  const db = await customerSupabase();
  if (!db) return { error: "Customer sign-in is not configured yet.", message: "" };
  const { data: { user } } = await db.auth.getUser();
  if (!user?.email) return { error: "Please sign in again.", message: "" };
  const currentPassword = String(form.get("currentPassword") || "");
  const password = passwordFrom(form);
  const confirmation = String(form.get("confirmPassword") || "");
  if (!currentPassword) return { error: "Enter your current password.", message: "" };
  if (!validNewPassword(password)) return { error: "Use a password of 12–128 characters.", message: "" };
  if (password !== confirmation) return { error: "Your new passwords do not match.", message: "" };
  if (currentPassword === password) return { error: "Choose a different password.", message: "" };
  const { data: verified, error } = await db.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (error || verified.user?.id !== user.id) return { error: "Your current password is not correct.", message: "" };
  const updated = await db.auth.updateUser({ password });
  if (updated.error) return { error: "Password could not be changed. Try again or use email recovery.", message: "" };
  await clearCustomerRecoveryPermission();
  await db.auth.signOut();
  redirect("/account/login?status=password-changed");
}
