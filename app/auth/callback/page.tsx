"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

function safeNextPath(value: string | null) {
  return value?.startsWith("/admin") ? value : "/admin";
}

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function finishSignIn() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) {
        setError("Owner access is not configured.");
        return;
      }

      const query = new URLSearchParams(window.location.search);
      const next = safeNextPath(query.get("next"));
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");
      const supabase = createBrowserClient(url, key);

      let authError: Error | null = null;
      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authError = result.error;
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        authError = result.error;
      } else {
        authError = new Error("The secure sign-in details were missing.");
      }

      window.history.replaceState({}, "", window.location.pathname);
      if (authError) {
        setError("This secure link is invalid or has expired. Request a new one.");
        return;
      }

      window.location.replace(next);
    }

    void finishSignIn();
  }, []);

  return (
    <main className="admin-shell admin-sign-in">
      <section className="admin-auth-card" aria-live="polite">
        <p className="eyebrow">Secure owner access</p>
        <h1>{error ? "The link could not be completed." : "Opening the studio…"}</h1>
        <p className={error ? "admin-form-error" : "admin-intro"}>
          {error || "Please wait while Podscape verifies your secure link."}
        </p>
        {error ? <Link className="button button-primary" href="/admin/forgot-password">Request a new link</Link> : null}
      </section>
    </main>
  );
}
