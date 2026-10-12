import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { signOutCustomer } from "./actions";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./customer-auth.module.css";

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/account/login");

  const { data: profile } = await db.from("customer_profiles")
    .select("display_name,created_at").eq("id", user.id).maybeSingle();
  const { verified } = await searchParams;
  const displayName = profile?.display_name || "Keeper";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Podscape Labs · Your account</p>
        <div className={styles.accountHeading}>
          <div><h1>Welcome, {displayName}.</h1><p>Your member details and future keeper tools live here.</p></div>
          <form action={signOutCustomer}><button className={styles.outlineButton} type="submit">Sign out</button></form>
        </div>
        {verified === "1" ? <p className={styles.success} role="status">Email confirmed. Welcome to Podscape.</p> : null}
        <div className={styles.dashboardGrid}>
          <section className={styles.panel}>
            <p className={styles.panelLabel}>Member record · AC / 001</p>
            <h2>Account details</h2>
            <dl className={styles.facts}><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Member since</dt><dd>{new Date(user.created_at).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}</dd></div></dl>
            <h3>Display name</h3>
            <CustomerAccountForm kind="profile" initialName={profile?.display_name || ""} /><div className={styles.securitySection}><h3>Account security</h3><p className={styles.secondary}>Manage your sign-in details securely.</p><div className={styles.securityActions}><Link className={styles.textLink} href="/account/change-password">Change password →</Link><Link className={styles.textLink} href="/account/forgot-password">Forgot password?</Link></div></div>
          </section>
          <section className={styles.panel}>
            <p className={styles.panelLabel}>Leaf Ledger · Later phase</p>
            <h2>My Collection</h2>
            <p className={styles.secondary}>Your personal species collection, wishlists, and keeper notes will appear here when those features are ready.</p>
            <Link className={styles.textLink} href="/ledger">Explore the Leaf Ledger →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
