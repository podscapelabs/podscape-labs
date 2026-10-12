"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestAdminPasswordReset, type AdminLoginState, updateAdminPassword } from "@/app/admin/actions";

const initialState: AdminLoginState = { error: "", message: "" };

export function AdminPasswordResetRequestForm() {
  const [state, action, pending] = useActionState(requestAdminPasswordReset, initialState);
  return <form className="admin-login-form" action={action}>
    <label htmlFor="reset-email">Owner email</label>
    <input id="reset-email" name="email" type="email" autoComplete="email" required disabled={pending} />
    {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
    {state.message ? <p className="admin-form-note" role="status">{state.message}</p> : null}
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Sending…" : "Send secure reset link"}</button>
    <Link className="admin-forgot-link" href="/admin">Return to sign in</Link>
  </form>;
}

export function AdminPasswordUpdateForm() {
  const [state, action, pending] = useActionState(updateAdminPassword, initialState);
  return <form className="admin-login-form" action={action}>
    <label htmlFor="new-password">New password</label>
    <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={14} required disabled={pending} />
    <label htmlFor="confirm-password">Confirm new password</label>
    <input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={14} required disabled={pending} />
    {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
    {state.message ? <p className="admin-form-note" role="status">{state.message}</p> : null}
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Updating…" : "Set new password"}</button>
    <Link className="admin-forgot-link" href="/admin">Return to Owner Studio</Link>
  </form>;
}
