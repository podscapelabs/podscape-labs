import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { customerAuthSiteUrl, customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";

export default async function CustomerForgotPasswordPage() {
  const db = await customerSupabase();
  return (
    <CustomerAuthShell index="AC / 003" eyebrow="Member access · Recovery" title="Find your way back." intro="Enter your account email and we'll send a password reset link if there's an account associated with it.">
      <p className={styles.panelLabel}>Password recovery</p>
      {!db || !customerAuthSiteUrl()
        ? <p className={styles.error}>Password recovery is not configured yet.</p>
        : <CustomerAccountForm kind="forgot" />}
    </CustomerAuthShell>
  );
}
