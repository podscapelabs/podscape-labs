import { redirect } from "next/navigation";
import { isApprovedTesterEmail } from "@/lib/customer-auth/access";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";

export default async function CustomerRegistrationPage() {
  const db = await customerSupabase();
  if (db) { const { data: { user } } = await db.auth.getUser(); if (user?.app_metadata?.role === "owner" || (user?.email && await isApprovedTesterEmail(user.email))) redirect("/app"); if (user) redirect("/early-access"); }
  return (
    <CustomerAuthShell index="AC / 002" eyebrow="Podscape Labs · Member access" title="Make a little space." intro="Create a keeper account. Your personal collection and future journal tools will connect here as the platform grows.">
      <p className={styles.panelLabel}>New member registration</p>
      {!db || !customerAuthSiteUrl()
        ? <p className={styles.error}>Member registration is not configured yet.</p>
        : <CustomerAccountForm kind="sign-up" />}
    </CustomerAuthShell>
  );
}
