"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  changeCustomerPassword,
  changeAuthenticatedCustomerPassword,
  requestCustomerPasswordReset,
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

export function CustomerAccountForm({ kind, initialName = "" }: { kind: FormKind; initialName?: string }) {
  const [state, submit, pending] = useActionState(formActions[kind], INITIAL_STATE);
  return (
    <form className={styles.form} action={submit}>
      {kind === "sign-up" || kind === "profile" ? (
        <div className={styles.field}>
          <label htmlFor="customer-display-name">Display name <span className={styles.optional}>(optional)</span></label>
          <input id="customer-display-name" type="text" name="displayName" maxLength={60} autoComplete="nickname" defaultValue={initialName} />
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
        <div className={styles.formLinks}><Link href="/account/forgot-password">Forgot password?</Link><Link href="/account/sign-up">Create an account →</Link></div>
      ) : null}
      {kind === "change" ? <p className={styles.formLinks}><Link href="/account">← Back to account</Link></p> : null}
      {kind === "sign-up" || kind === "forgot" || kind === "reset" ? (
        <p className={styles.formLinks}><Link href="/account/login">← Back to sign in</Link></p>
      ) : null}
    </form>
  );
}
