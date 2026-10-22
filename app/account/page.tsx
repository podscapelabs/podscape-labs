import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { signOutCustomer } from "./actions";
import { customerSupabase } from "@/lib/customer-auth/server";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import styles from "./account-dashboard.module.css";

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/account/login");
  const { data: profile } = await db.from("customer_profiles").select("display_name,created_at").eq("id",user.id).maybeSingle();
  const { verified } = await searchParams;
  const displayName = profile?.display_name || "Keeper";
  const joined = new Date(profile?.created_at || user.created_at).toLocaleDateString("en-CA",{month:"long",year:"numeric"});
  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.hero}><p className={styles.eyebrow}>PODSCAPE LABS · MEMBER SPACE</p><h1>My Account</h1><p>Your profile, progress and preferences.</p></header>
      {verified==="1" ? <p role="status" className={styles.notice}>Email confirmed. Welcome to PodScape.</p> : null}
      <section className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">✦</span>
        <div className={styles.profileText}><h2>{displayName}</h2><p>PodScape member</p><small>Member since {joined}</small></div>
        <a href="#profile-settings" className={styles.edit}>Edit Profile</a>
      </section>
      <section className={styles.progress} aria-label="Keeper progress">
        <div className={styles.progressHeading}><span>✧</span><h2>Keeper Progress</h2><small>Coming soon</small></div>
        <p>Discover, learn and grow with PodScape.</p>
        <div className={styles.bar} aria-label="EXP progression is coming soon"><span /></div>
        <div className={styles.progressFoot}><span>EXP tracking is in development</span><span>Rewards to follow</span></div>
      </section>
      <section className={styles.activity}><div className={styles.activityHeading}><h2>Recent Activity</h2></div><p>Activity history will appear here as you explore PodScape, complete activities and care for your colonies.</p></section>
      <div className={styles.accordions}>
        <details><summary><span className={styles.symbol}>♧</span><span><strong>Rewards &amp; Benefits</strong><small>Discounts, perks and future unlocks.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>Keeper EXP and member rewards are being developed. Discount thresholds and eligibility will be announced when the program launches.</p></div></details>
        <details><summary><span className={styles.symbol}>◷</span><span><strong>Activity History</strong><small>Your care logs, guides and more.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>For now, your colony care records are available in Manager.</p><Link href="/keeper">Open Manager →</Link></div></details>
        <details><summary><span className={styles.symbol}>☷</span><span><strong>Preferences</strong><small>Appearance and notifications.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>Additional member preferences will appear here as they become available.</p></div></details>
        <details id="profile-settings"><summary><span className={styles.symbol}>♢</span><span><strong>Account &amp; Security</strong><small>Profile, email, password and privacy.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p className={styles.label}>Display name</p><CustomerAccountForm kind="profile" initialName={profile?.display_name || ""}/><p className={styles.label}>Email</p><p>{user.email}</p><Link href="/account/change-password">Change password →</Link><Link href="/account/forgot-password">Password recovery →</Link><form action={signOutCustomer}><button type="submit" className={styles.signout}>Sign out</button></form></div></details>
      </div>
    </div>
    <KeeperMobileNav active="menu"/>
  </main>;
}
