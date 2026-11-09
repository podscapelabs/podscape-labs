import Link from "next/link";
import {redirect} from "next/navigation";
import {CustomerAccountForm} from "@/components/CustomerAccountForm";
import {signOutCustomer} from "./actions";
import {customerSupabase} from "@/lib/customer-auth/server";
import {AppearancePreference} from "@/components/AppearancePreference";
import {InstallPodscape} from "@/components/InstallPodscape";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {ownerDesks,ownerOperations} from "@/data/owner-desks";
import styles from "./account-dashboard.module.css";
import hub from "./my-podscape.module.css";

export const dynamic="force-dynamic";

export default async function CustomerAccountPage({searchParams}:{searchParams:Promise<{verified?:string}>}){
 const db=await customerSupabase();
 if(!db)redirect("/account/login");
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/account/login");
 const [profileResult,progressResult]=await Promise.all([
  db.from("customer_profiles").select("display_name,created_at").eq("id",user.id).maybeSingle(),
  db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle()
 ]);
 const profile=profileResult.data;
 const exp=Math.max(0,Number(progressResult.data?.total_exp||0));
 const coins=Math.max(0,Number(progressResult.data?.pod_coins||0));
 const level=Math.floor(Math.sqrt(exp/100))+1;
 const levelStart=100*(level-1)**2;
 const levelEnd=100*level**2;
 const pct=Math.min(100,Math.max(0,100*(exp-levelStart)/(levelEnd-levelStart)));
 const displayName=profile?.display_name||"Keeper";
 const joined=new Date(profile?.created_at||user.created_at).toLocaleDateString("en-CA",{month:"long",year:"numeric"});
 const isOwner=await isAdminAuthenticated();
 const {verified}=await searchParams;
 return <main className={styles.page}><div className={styles.inner}>
  <header className={styles.accountHeader}>
   <div><p className={styles.eyebrow}>PODSCAPE LABS / YOUR ACCOUNT</p><h1>My Account</h1><p>Your profile, progress and preferences.</p></div>
   <span className={styles.accountMark} aria-hidden="true">✦</span>
  </header>
  {verified==="1"?<p role="status" className={styles.notice}>Email confirmed. Welcome to Podscape.</p>:null}
  <section className={styles.accountSummary} aria-label="Your membership">
   <div className={styles.accountSummaryTop}>
    <div><small>WELCOME BACK</small><h2>Hello, {displayName.trim().split(/\s+/)[0]}! <span aria-hidden="true">✿</span></h2><p>Podscape member since {joined}</p></div>
    <Link href="/account/progress" className={styles.accountLevel}>Level <strong>{level}</strong></Link>
   </div>
   <div className={styles.accountProgressLabels}><span>{(exp-levelStart).toLocaleString("en-CA")} / {(levelEnd-levelStart).toLocaleString("en-CA")} EXP to next level</span><Link href="/account/progress">My Progress →</Link></div>
   <div className={hub.track} role="progressbar" aria-label="Progress to next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={exp}><span style={{width:pct+"%"}}/></div>
   <div className={styles.accountBalances}><span>✧ {exp.toLocaleString("en-CA")} EXP</span><span>◉ {coins.toLocaleString("en-CA")} Pod Coins</span></div>
  </section>
  <section className={styles.accountActions} aria-label="Account sections">
   <a href="#account-preferences"><span aria-hidden="true">☷</span><strong>Preferences</strong><small>Appearance & app</small><b aria-hidden="true">↘</b></a>
   <a href="#account-personal"><span aria-hidden="true">♢</span><strong>Personal Info</strong><small>Profile & security</small><b aria-hidden="true">↘</b></a>
   <Link href="/account/progress"><span aria-hidden="true">✦</span><strong>My Progress</strong><small>Levels & achievements</small><b aria-hidden="true">↗</b></Link>
   <a href="#account-rewards"><span aria-hidden="true">♧</span><strong>Rewards</strong><small>Benefits & perks</small><b aria-hidden="true">↘</b></a>
  </section>
  {isOwner?<section className={styles.accountOwner} aria-label="Owner administration">
   <details id="owner-tools">
    <summary><span className={styles.accountOwnerMark} aria-hidden="true">✦</span><span><strong>Owner Tools</strong><small>Your private Podscape workspace</small></span><span className={styles.chevron} aria-hidden="true">⌄</span></summary>
    <div className={styles.accountOwnerBody}>
     <p className={styles.accountGroupLabel}>Content desks</p>
     <nav className={styles.accountOwnerGrid} aria-label="Owner desks">
      {ownerDesks.map(desk=><Link href={desk.href} key={desk.href}><span aria-hidden="true">{desk.symbol}</span><strong>{desk.title}</strong><small>{desk.label}</small></Link>)}
     </nav>
     <p className={styles.accountGroupLabel}>Operations</p>
     <nav className={styles.accountOwnerOperations} aria-label="Owner operations">
      {ownerOperations.map(item=><Link href={item.href} key={item.href}><span aria-hidden="true">{item.symbol}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></Link>)}
     </nav>
    </div>
   </details>
  </section>:null}
  <section className={styles.accountSettings} aria-label="Account settings">
   <div className={styles.accountSettingsHeading}><h2>Settings</h2><p>Everything else, neatly tucked away.</p></div>
   <div className={styles.accordions}>
    <details id="account-preferences"><summary><span className={styles.symbol}>☷</span><span><strong>Preferences</strong><small>Appearance and app installation</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><AppearancePreference/><InstallPodscape variant="settings"/></div></details>
    <details id="account-personal"><summary><span className={styles.symbol}>♢</span><span><strong>Personal Information</strong><small>Name, email and account security</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p className={styles.label}>Name</p><CustomerAccountForm kind="profile" initialName={profile?.display_name||""}/><p className={styles.label}>Email</p><p>{user.email}</p><h3>Account security</h3><Link href="/account/change-password">Change password →</Link><Link href="/account/forgot-password">Password recovery →</Link><form action={signOutCustomer}><button type="submit" className={styles.signout}>Sign out</button></form></div></details>
    <details id="account-rewards"><summary><span className={styles.symbol}>♧</span><span><strong>Rewards &amp; Benefits</strong><small>Keeper perks and future unlocks</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>Keeper EXP and member rewards are being developed. Discount thresholds and eligibility will be announced when the program launches.</p><Link href="/account/progress">View your progress →</Link></div></details>
   </div>
  </section>
 </div></main>;
}
