import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { customerSupabase } from "@/lib/customer-auth/server";
import { CustomerAuthShell } from "../CustomerAuthShell";
import styles from "../customer-auth.module.css";
export default async function CustomerChangePasswordPage() {
 const db = await customerSupabase();
 const user = db ? (await db.auth.getUser()).data.user : null;
 if (!user) redirect("/account/login");
 return <CustomerAuthShell index="AC / 005" eyebrow="Member access · Security" title="Change your password." intro="Confirm your current password, then choose a new one."><p className={styles.panelLabel}>Account security</p><CustomerAccountForm kind="change" /></CustomerAuthShell>;
}
