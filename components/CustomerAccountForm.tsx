"use client";

import { useActionState } from "react";
import {
  changeCustomerPassword,
  changeAuthenticatedCustomerPassword,
  requestCustomerPasswordReset,
  resendCustomerVerification,
  signInCustomer,
  signUpCustomer,
  updateCustomerProfile,
} from "@/app/account/actions";
import styles from "@/app/account/customer-auth.module.css";

type FormKind = "login" | "sign-up" | "forgot" | "reset" | "profile" | "change";

const INITIAL_STATE = { error: "", message: "" };

const formActions = {
  login: signInCustomer,
  "sign-up": signUpCustomer,
  forgot: requestCustomerPasswordReset,
  reset: changeCustomerPassword,
  profile: updateCustomerProfile,
  change: changeAuthenticatedCustomerPassword,
};

/** Separate form avoids nesting forms and works from both Pod Access and account pages. */
function ResendVerificationForm() {
  const [state, submit, pending] = useActionState(resendCustomerVerification, INITIAL_STATE);
  return (
    <form className={styles.form} action={submit} aria-label="Resend email verification">
      <div className={styles.field}>
        <label htmlFor="resend-verification-email">Didn&apos;t receive a verification email?</label>
        <input id="resend-verification-email" type="email" name="email"
          autoComplete="email" maxLength={254} placeholder="Your approved beta email" required />
      </div>
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.message ? <p className={styles.success} role="status">{state.message}</p> : null}
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Requesting…" : "Resend verification email"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

export function CustomerAccountForm({ kind, initialName = "", embedded = false }: { kind: FormKind; initialName?: string; embedded?: boolean }) {
  const [state, submit, pending] = useActionState(formActions[kind], INITIAL_STATE);
  return (
    <>
    <form className={styles.form} action={submit}>
      {kind === "sign-up" || kind === "profile" ? (
        <div className={styles.field}>
          <label htmlFor="customer-display-name">Username <span aria-hidden="true">*</span></label>
          <input id="customer-display-name" type="text" name="displayName" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" title="3–24 letters, numbers or underscores; no spaces" autoComplete="nickname" defaultValue={initialName} required />
          <small>Unique across PodScape · 3–24 letters, numbers or underscores · No spaces</small>
        </div>
      ) : null}
      {["login", "sign-up", "forgot"].includes(kind) ? (
        <div className={styles.field}>
          <label htmlFor="customer-email">Email</label>
          <input id="customer-email" type="email" name="email" autoComplete="email" maxLength={254} required />
        </div>
      ) : null}
      {kind === "change" ? <div className={styles.field}><label htmlFor="customer-current-password">Current password</label><input id="customer-current-password" type="password" name="currentPassword" autoComplete="current-password" required /></div> : null}
      {["login", "sign-up", "reset", "change"].includes(kind) ? (
        <div className={styles.field}>
          <label htmlFor="customer-password">{kind === "reset" || kind === "change" ? "New password" : "Password"}</label>
          <input
            id="customer-password" type="password" name="password"
            autoComplete={kind === "login" ? "current-password" : "new-password"}
            minLength={kind === "login" ? undefined : 12} maxLength={128} required
          />
          {kind !== "login" ? <small>At least 12 characters.</small> : null}
        </div>
      ) : null}
      {["sign-up", "reset", "change"].includes(kind) ? (
        <div className={styles.field}>
          <label htmlFor="customer-confirm-password">Confirm password</label>
          <input id="customer-confirm-password" type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required />
        </div>
      ) : null}
      {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
      {state.message ? <p className={styles.success} role="status">{state.message}</p> : null}
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Working…" : ({ login: "Sign in", "sign-up": "Create account", forgot: "Send recovery link", reset: "Update password", profile: "Save profile", change: "Change password" })[kind]}
        <span aria-hidden="true">→</span>
      </button>
      {kind === "login" ? (
        <div className={styles.formLinks}><a href="/account/forgot-password">Forgot password?</a>{!embedded ? <a href="/account/sign-up">Create an account →</a> : null}</div>
      ) : null}
      {kind === "change" ? <p className={styles.formLinks}><a href="/account">← Back to account</a></p> : null}
      {!embedded && (kind === "sign-up" || kind === "forgot" || kind === "reset") ? (
        <p className={styles.formLinks}><a href="/account/login">← Back to sign in</a></p>
      ) : null}
    </form>
    {(kind === "login" || kind === "sign-up") ? <ResendVerificationForm /> : null}
    </>
  );
}
