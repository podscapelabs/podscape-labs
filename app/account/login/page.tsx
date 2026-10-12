import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";

export default async function CustomerLoginPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const db = await customerSupabase();
  if (db && (await db.auth.getUser()).data.user) redirect("/account");
  const { status } = await searchParams;
  return (
    <CustomerAuthShell index="AC / 001" eyebrow="Podscape Labs · Member access" title="Welcome back." intro="Your place to manage the colonies, references, and resources that matter to you.">
      <p className={styles.panelLabel}>Member sign in</p>
      {status === "invalid-link" ? <p className={styles.error} role="alert">That email link has expired or cannot be used. Please try again.</p> : null}
      {status === "configuration" ? <p className={styles.error} role="alert">Password recovery is not configured yet.</p> : null}
      {!db ? <p className={styles.error}>Member sign-in is not configured yet.</p> : <CustomerAccountForm kind="login" />}
    </CustomerAuthShell>
  );
}
