import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { signOutCustomer } from "./actions";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./account-dashboard.module.css";
import { AppearancePreference } from "@/components/AppearancePreference";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/account/login");
  const { data: profile } = await db.from("customer_profiles").select("display_name,created_at").eq("id",user.id).maybeSingle();
  const { data: progress, error: progressError } = await db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle();
  const totalExp = Number(progress?.total_exp || 0);
  const level = Math.floor(Math.sqrt(totalExp / 100)) + 1;
  const levelStart = 100 * (level - 1) ** 2;
  const levelEnd = 100 * level ** 2;
  const progressPercent = Math.max(0,Math.min(100,Math.round(100 * (totalExp - levelStart) / (levelEnd - levelStart))));
  const { verified } = await searchParams;
  const isOwner = await isAdminAuthenticated();
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
      <section className={styles.progress} aria-label="PodScape progress">
        <div className={styles.progressHeading}><span>✧</span><h2>My Progress</h2><small>Level {level}</small></div>
        <p>Explore, learn and participate across PodScape. Your progress stays with you.</p>
        <div className={styles.progressFoot}><strong>{totalExp.toLocaleString("en-CA")} EXP</strong><strong>{Number(progress?.pod_coins || 0).toLocaleString("en-CA")} Pod Coins</strong></div>
        <div className={styles.bar} role="progressbar" aria-label="Progress to next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={totalExp}><span style={{width:progressPercent+"%"}} /></div>
        <div className={styles.progressFoot}><span>Level {level}</span><span>{(levelEnd-totalExp).toLocaleString("en-CA")} EXP to Level {level+1}</span></div>
        {progressError ? <p>Progress data will appear once the new progression database is enabled.</p> : null}
        <p><Link href="/account/progress">View quests and milestones →</Link></p>
      </section>
      <section className={styles.activity}><div className={styles.activityHeading}><h2>Recent Activity</h2></div><p>Activity history will appear here as you explore PodScape, complete activities and care for your colonies.</p></section>
      <div className={styles.accordions}>
        {isOwner ? <details><summary><span className={styles.symbol}>✦</span><span><strong>Owner Tools</strong><small>Private content desks and studio controls.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><div style={{display:"grid",gap:"12px"}}><Link href="/admin">Owner studio →</Link><Link href="/admin/species">Species desk →</Link><Link href="/admin/guides">Guide desk →</Link><Link href="/admin/lab">Lab desk →</Link><Link href="/admin/products">Product desk →</Link><Link href="/keeper">Manager dashboard →</Link></div></div></details> : null}
        <details><summary><span className={styles.symbol}>♧</span><span><strong>Rewards &amp; Benefits</strong><small>Discounts, perks and future unlocks.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>Keeper EXP and member rewards are being developed. Discount thresholds and eligibility will be announced when the program launches.</p></div></details>
        <details><summary><span className={styles.symbol}>◷</span><span><strong>Activity History</strong><small>Your care logs, guides and more.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>For now, your colony care records are available in Manager.</p><Link href="/keeper">Open Manager →</Link></div></details>
        <details><summary><span className={styles.symbol}>☷</span><span><strong>Preferences</strong><small>Appearance and notifications.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><AppearancePreference/><p>Notification preferences will be available later.</p></div></details>
        <details id="profile-settings"><summary><span className={styles.symbol}>♢</span><span><strong>Personal Information</strong><small>Name, email and account security.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p className={styles.label}>Name</p><CustomerAccountForm kind="profile" initialName={profile?.display_name || ""}/><p className={styles.label}>Email</p><p>{user.email}</p><p>Shipping addresses will be managed separately when checkout is available.</p><h3>Account security</h3><Link href="/account/change-password">Change password →</Link><Link href="/account/forgot-password">Password recovery →</Link><form action={signOutCustomer}><button type="submit" className={styles.signout}>Sign out</button></form></div></details>
      </div>
    </div>

  </main>;
}
