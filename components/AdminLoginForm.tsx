"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminLoginState } from "@/app/admin/actions";
import Link from "next/link";

const initialState: AdminLoginState = { error: "", message: "" };

export function AdminLoginForm({ configured, accountLogin }: { configured: boolean; accountLogin: boolean }) {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <input type="hidden" name="authMode" value={accountLogin ? "account" : "legacy"} />
      {accountLogin ? <><label htmlFor="email">Owner email</label><input id="email" name="email" type="email" autoComplete="username" required disabled={pending} /></> : null}
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={!configured || pending}
      />
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="admin-form-note" role="status">{state.message}</p> : null}
      <button className="button button-primary" type="submit" disabled={!configured || pending}>
        {pending ? "Checking…" : "Open studio"}
      </button>
      {accountLogin ? <Link className="admin-forgot-link" href="/admin/forgot-password">Forgot your password?</Link> : null}
      {!configured ? (
        <p className="admin-form-note">Add the two owner access settings before signing in.</p>
      ) : null}
    </form>
  );
}
