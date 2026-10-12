import Link from "next/link";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { hasCustomerRecoveryPermission } from "@/lib/customer-auth/recovery";
import { customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";

export default async function CustomerResetPasswordPage() {
  const db = await customerSupabase();
  const user = db ? (await db.auth.getUser()).data.user : null;
  const allowed = user && (await hasCustomerRecoveryPermission(user.id));
  return (
    <CustomerAuthShell index="AC / 004" eyebrow="Member access · Recovery" title="A fresh start." intro="Choose a new password to secure your Podscape account.">
      <p className={styles.panelLabel}>Set a new password</p>
      {allowed ? <CustomerAccountForm kind="reset" /> : (
        <p className={styles.error}>This recovery session has expired or is invalid. <Link href="/account/forgot-password">Request a new link →</Link></p>
      )}
    </CustomerAuthShell>
  );
}
