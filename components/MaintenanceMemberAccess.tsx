"use client";

import { useState } from "react";
import { CustomerAccountForm } from "./CustomerAccountForm";
import styles from "./MaintenanceMemberAccess.module.css";

/** Embedded entry point for invited early-access members on the public maintenance page. */
export function MaintenanceMemberAccess() {
  const [mode, setMode] = useState<"login" | "sign-up">("login");

  return (
    <section className={styles.section} id="member-access" aria-labelledby="member-access-title">
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>PodScape · Private testing</p>
        <h2 id="member-access-title">A little something for our early explorers.</h2>
        <p>Have an invitation? Sign in here to explore the platform while the public site is being prepared. New testers can register using their approved email.</p>
        <p className={styles.note}>Invitation-only access. Member accounts cannot access Owner Studio.</p>
      </div>
      <div className={styles.panel}>
        <div className={styles.tabs} role="group" aria-label="Member access">
          <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? styles.selected : undefined} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" aria-pressed={mode === "sign-up"} className={mode === "sign-up" ? styles.selected : undefined} onClick={() => setMode("sign-up")}>Create account</button>
        </div>
        <div className={styles.form}>
          <h3>{mode === "login" ? "Welcome back." : "Join the testing group."}</h3>
          <p>{mode === "login" ? "Enter the email and password for your PodScape account." : "Use the email address that was added to the tester list. You'll be asked to confirm it before signing in."}</p>
          <CustomerAccountForm key={mode} kind={mode} embedded />
        </div>
      </div>
    </section>
  );
}
