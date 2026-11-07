import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CustomerAccountForm } from "@/components/CustomerAccountForm";
import { signOutCustomer } from "./actions";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSpeciesRecords } from "@/lib/species-store";
import { achievementCatalog } from "@/data/achievement-catalog";
import { AppearancePreference } from "@/components/AppearancePreference";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ownerDesks, ownerOperations } from "@/data/owner-desks";
import styles from "./account-dashboard.module.css";
import hub from "./my-podscape.module.css";

export const dynamic = "force-dynamic";

type Activity = {key:string; icon:string; title:string; description:string; at:string; href:string};

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const db = await customerSupabase();
  if (!db) redirect("/account/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/account/login");
  const [profileResult,progressResult,viewsResult,collectionResult,achievementsResult,enclosuresResult] = await Promise.all([
    db.from("customer_profiles").select("display_name,created_at").eq("id",user.id).maybeSingle(),
    db.from("member_progress").select("total_exp,pod_coins").eq("user_id",user.id).maybeSingle(),
    db.from("member_species_views").select("species_id").eq("user_id",user.id),
    db.from("member_species_collection").select("species_id,added_at").eq("user_id",user.id).order("added_at",{ascending:false}).limit(100),
    db.from("member_achievements").select("achievement_key,unlocked_at").eq("user_id",user.id).order("unlocked_at",{ascending:false}).limit(100),
    db.from("keeper_enclosures").select("id,name,species_id,quantity,updated_at,is_archived").eq("user_id",user.id).eq("is_archived",false).order("updated_at",{ascending:false}).limit(100),
  ]);
  const profile=profileResult.data;
  const progress=progressResult.data;
  const exp=Math.max(0,Number(progress?.total_exp||0));
  const coins=Math.max(0,Number(progress?.pod_coins||0));
  const level=Math.floor(Math.sqrt(exp/100))+1;
  const levelStart=100*(level-1)**2;
  const levelEnd=100*level**2;
  const pct=Math.min(100,Math.max(0,100*(exp-levelStart)/(levelEnd-levelStart)));
  const discoveries=viewsResult.error?null:viewsResult.data?.length??0;
  const collection=collectionResult.error?null:collectionResult.data||[];
  const achievements=achievementsResult.error?null:achievementsResult.data||[];
  const enclosures=enclosuresResult.error?null:enclosuresResult.data||[];
  const unlockedKeys=new Set((achievements||[]).map(a=>a.achievement_key));
  if(unlockedKeys.has("field_observer"))unlockedKeys.add("ledger_five_species");
  const unlockedCount=achievements===null?null:achievementCatalog.filter(a=>a.status==="available"&&unlockedKeys.has(a.key)).length;
  const latestBin=enclosures?.[0];
  let speciesImage: string|null=null;
  let speciesName="";
  const speciesNames=new Map<string,string>();
  if(latestBin || (collection && collection.length)){
    try{
      const records=await getSpeciesRecords();
      for(const record of records) speciesNames.set(record.id,record.commonName||record.scientificName||"Species");
      if(latestBin){
        const species=records.find(s=>s.id===latestBin.species_id);
        speciesImage=species?.image||null;
        speciesName=species?.commonName||species?.scientificName||"";
      }
    }catch{ /* Member dashboard remains available if the public Ledger is unavailable. */ }
  }
  const activities:Activity[]=[];
  for(const a of achievements||[]){
    const definition=achievementCatalog.find(entry=>entry.key===a.achievement_key || (a.achievement_key==="field_observer"&&entry.key==="ledger_five_species"));
    if(definition)activities.push({key:"ach-"+a.achievement_key,icon:"✦",title:definition.title+" unlocked",description:"Achievement earned",at:a.unlocked_at,href:"/account/progress"});
  }
  for(const item of (collection||[]).slice(0,8)){
    activities.push({key:"col-"+item.species_id,icon:"❧",title:(speciesNames.get(item.species_id)||"Species")+" added",description:"Added to your Leaf Ledger collection",at:item.added_at,href:"/ledger"});
  }
  activities.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  const {verified}=await searchParams;
  const isOwner=await isAdminAuthenticated();
  const displayName=profile?.display_name||"Keeper";
  const firstName=displayName.trim().split(/\s+/)[0]||"Keeper";
  const joined=new Date(profile?.created_at||user.created_at).toLocaleDateString("en-CA",{month:"long",year:"numeric"});
  const nextStep = !collection?.length ? {title:"Start your collection",detail:"Discover a species and add it to your Ledger.",href:"/ledger",cta:"Explore species"}
    : !enclosures?.length ? {title:"Give your collection a home",detail:"Create a bin for your first colony in Manager.",href:"/keeper/collection",cta:"Create a colony"}
    : {title:"Keep your little world growing",detail:"Visit your colonies, update care notes, or explore a new species.",href:"/keeper",cta:"Open Manager"};

  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={hub.header}>
        <div><p className={styles.eyebrow}>PODSCAPE LABS / MEMBER SPACE</p><h1>My PodScape</h1><p>Your little world, all in one place.</p></div>
        <span className={hub.headerLeaf} aria-hidden="true">❧</span>
      </header>
      {verified==="1"?<p role="status" className={styles.notice}>Email confirmed. Welcome to PodScape.</p>:null}
      <section className={hub.welcome} aria-label="Your keeper level">
        <div className={hub.welcomeTop}><div><small>WELCOME BACK</small><h2>Hello, {firstName}! <span aria-hidden="true">✿</span></h2><p>Every discovery is part of your journey.</p></div><Link className={hub.level} href="/account/progress">Level <strong>{level}</strong></Link></div>
        <div className={hub.progressLabels}><span>{(exp-levelStart).toLocaleString("en-CA")} / {(levelEnd-levelStart).toLocaleString("en-CA")} EXP</span><span>{(levelEnd-exp).toLocaleString("en-CA")} to next level</span></div>
        <div className={hub.track} role="progressbar" aria-label="Progress to next level" aria-valuemin={levelStart} aria-valuemax={levelEnd} aria-valuenow={exp}><span style={{width:pct+"%"}}/></div>
        <div className={hub.currency}><span>✧ {exp.toLocaleString("en-CA")} EXP</span><span>◉ {coins.toLocaleString("en-CA")} Pod Coins</span></div>
      </section>
      <section className={hub.stats} aria-label="Your PodScape at a glance">
        <Link href="/ledger"><span aria-hidden="true">❧</span><strong>{discoveries??"—"}</strong><small>Discovered</small></Link>
        <Link href="/keeper/collection"><span aria-hidden="true">▤</span><strong>{enclosures?.length??"—"}</strong><small>My Colonies</small></Link>
        <Link href="/account/progress"><span aria-hidden="true">✦</span><strong>{unlockedCount??"—"}</strong><small>Achievements</small></Link>
      </section>
      <section className={hub.section}>
        <div className={hub.heading}><h2>My Little World</h2><Link href="/keeper/collection">My colonies →</Link></div>
        {latestBin?<Link className={hub.colony} href={`/keeper/${latestBin.id}`}>
          <span className={hub.photo}>{speciesImage?<Image src={speciesImage} alt="" fill sizes="(max-width:700px) 120px,180px" style={{objectFit:"cover"}}/>:<span aria-hidden="true">❧</span>}</span>
          <span className={hub.colonyText}><strong>{latestBin.name}</strong><small>{speciesName||"Your colony"} · {latestBin.quantity} recorded</small><em>View colony <span aria-hidden="true">→</span></em></span>
        </Link>:<div className={hub.empty}><strong>Your little world begins here.</strong><p>Add a colony in Manager to see it featured on your dashboard.</p><Link href="/keeper/collection">Create a colony →</Link></div>}
      </section>
      <section className={hub.next}><span className={hub.nextIcon} aria-hidden="true">✧</span><div><small>SUGGESTED NEXT STEP</small><h2>{nextStep.title}</h2><p>{nextStep.detail}</p></div><Link href={nextStep.href}>{nextStep.cta} →</Link></section>
      <section className={hub.section}>
        <div className={hub.heading}><h2>Continue Exploring</h2></div>
        <div className={hub.explore}>
          <Link href="/ledger"><span aria-hidden="true">❧</span><strong>Leaf Ledger</strong><small>Discover your next species</small><b>↗</b></Link>
          <Link href="/fun-zone"><span aria-hidden="true">✧</span><strong>Fun Zone</strong><small>Play a little puzzle</small><b>↗</b></Link>
          <Link href="/account/progress"><span aria-hidden="true">✦</span><strong>My Progress</strong><small>See your milestones</small><b>↗</b></Link>
          <Link href="/keeper"><span aria-hidden="true">▤</span><strong>Manager</strong><small>Check on your colonies</small><b>↗</b></Link>
        </div>
      </section>
      <section className={hub.section}>
        <div className={hub.heading}><h2>Recent Activity</h2><Link href="/account/progress">My achievements →</Link></div>
        {activities.length?<div className={hub.activities}>{activities.slice(0,5).map(a=><Link href={a.href} key={a.key}><span className={hub.activityIcon} aria-hidden="true">{a.icon}</span><span><strong>{a.title}</strong><small>{a.description} · {new Date(a.at).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</small></span><b aria-hidden="true">›</b></Link>)}</div>:<div className={hub.empty}><strong>Your story is just beginning.</strong><p>Discover species and unlock achievements to build your activity history.</p><Link href="/ledger">Explore the Ledger →</Link></div>}
      </section>
      <section className={hub.settingsHeading}><div><p className={styles.eyebrow}>YOUR ACCOUNT</p><h2>Profile &amp; Settings</h2></div><small>Member since {joined}</small></section>
      <section className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true">✦</span>
        <div className={styles.profileText}><h2>{displayName}</h2><p>PodScape member</p><small>Manage your personal details below.</small></div>
        <a href="#profile-settings" className={styles.edit}>Edit Profile</a>
      </section>
      <div className={styles.accordions}>
        {isOwner ? <details id="owner-tools"><summary><span className={styles.symbol}>✦</span><span><strong>Owner Tools</strong><small>Manage Podscape content and private testing in one place.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><nav className={styles.ownerDeskList} aria-label="Owner desks">{ownerDesks.map(desk=><Link href={desk.href} key={desk.href}><span className={styles.ownerDeskSymbol} aria-hidden="true">{desk.symbol}</span><span className={styles.ownerDeskText}><strong>{desk.title}</strong><small>{desk.label} · {desk.description}</small></span><span className={styles.ownerDeskArrow} aria-hidden="true">↗</span></Link>)}</nav><p className={styles.ownerGroupLabel}>Access &amp; settings</p><nav className={styles.ownerDeskList} aria-label="Owner operations">{ownerOperations.map(item=><Link href={item.href} key={item.href}><span className={styles.ownerDeskSymbol} aria-hidden="true">{item.symbol}</span><span className={styles.ownerDeskText}><strong>{item.title}</strong><small>{item.description}</small></span><span className={styles.ownerDeskArrow} aria-hidden="true">↗</span></Link>)}</nav></div></details> : null}
        <details><summary><span className={styles.symbol}>♧</span><span><strong>Rewards &amp; Benefits</strong><small>Discounts, perks and future unlocks.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>Keeper EXP and member rewards are being developed. Discount thresholds and eligibility will be announced when the program launches.</p></div></details>
        <details><summary><span className={styles.symbol}>◷</span><span><strong>Activity History</strong><small>Your care logs, guides and more.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p>For now, your colony care records are available in Manager.</p><Link href="/keeper">Open Manager →</Link></div></details>
        <details><summary><span className={styles.symbol}>☷</span><span><strong>Preferences</strong><small>Appearance and notifications.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><AppearancePreference/><p>Notification preferences will be available later.</p></div></details>
        <details id="profile-settings"><summary><span className={styles.symbol}>♢</span><span><strong>Personal Information</strong><small>Name, email and account security.</small></span><span className={styles.chevron}>⌄</span></summary><div className={styles.panel}><p className={styles.label}>Name</p><CustomerAccountForm kind="profile" initialName={profile?.display_name || ""}/><p className={styles.label}>Email</p><p>{user.email}</p><p>Shipping addresses will be managed separately when checkout is available.</p><h3>Account security</h3><Link href="/account/change-password">Change password →</Link><Link href="/account/forgot-password">Password recovery →</Link><form action={signOutCustomer}><button type="submit" className={styles.signout}>Sign out</button></form></div></details>
      </div>
    </div>
  </main>;
}
