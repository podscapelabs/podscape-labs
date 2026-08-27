"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminLoginState } from "@/app/admin/actions";

const initialState: AdminLoginState = { error: "" };

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(signInAdmin, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label htmlFor="password">Owner password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={!configured || pending}
      />
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      <button className="button button-primary" type="submit" disabled={!configured || pending}>
        {pending ? "Checking…" : "Open studio"}
      </button>
      {!configured ? (
        <p className="admin-form-note">Add the two owner access settings before signing in.</p>
      ) : null}
    </form>
  );
}
