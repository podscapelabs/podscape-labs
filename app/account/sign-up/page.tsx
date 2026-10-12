import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";

export default async function CustomerRegistrationPage() {
  const db = await customerSupabase();
  if (db && (await db.auth.getUser()).data.user) redirect("/account");
  return (
    <CustomerAuthShell index="AC / 002" eyebrow="Podscape Labs · Member access" title="Make a little space." intro="Create a keeper account. Your personal collection and future journal tools will connect here as the platform grows.">
      <p className={styles.panelLabel}>New member registration</p>
      {!db || !customerAuthSiteUrl()
        ? <p className={styles.error}>Member registration is not configured yet.</p>
        : <CustomerAccountForm kind="sign-up" />}
    </CustomerAuthShell>
  );
}
