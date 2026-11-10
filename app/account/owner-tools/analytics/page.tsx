import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOwnerAnalyticsStats } from "@/lib/owner-analytics";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { OnlineNow } from "@/components/OnlineNow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Analytics | PodScape Labs", robots: { index: false, follow: false } };

const format = (value:number|null) => value === null ? "—" : value.toLocaleString("en-CA");

export default async function OwnerAnalyticsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const stats = await getOwnerAnalyticsStats();
  const peak = Math.max(1,...stats.registrationsByDay.map(item=>item.count));
  const metrics = [
    {label:"Registered",value:stats.accounts,icon:"community" as const,description:"All created accounts"},
    {label:"Confirmed",value:stats.confirmed,icon:"check" as const,description:"Verified email"},
    {label:"New this week",value:stats.last7d,icon:"calendar" as const,description:"Last 7 rolling days"},
    {label:"Active bins",value:stats.activeBins,icon:"jar" as const,description:"Includes owner/test bins"},
  ];
  return <main className={styles.page}><div className={styles.wrap}>
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>OWNER STUDIO · PRIVATE ANALYTICS</p>
        <h1>Platform pulse</h1>
        <p>A clear view of your community and the activity behind PodScape.</p>
        <Link href="/account/owner-tools" className={styles.back}>← Owner Studio</Link>
      </div>
      <div className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="community"/></div>
    </header>

    <section className={styles.section} aria-labelledby="overview-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>OVERVIEW</p><h2 id="overview-title">At a glance</h2></div><span className={styles.detail}>Live database snapshot</span></div>
      <div className={styles.statsGrid}>
        {metrics.map(item=><article className={styles.metric} key={item.label}>
          <div className={styles.metricTop}><span>{item.label}</span><PodscapeLineIcon name={item.icon}/></div>
          <strong>{format(item.value)}</strong>
          <small>{item.description}</small>
        </article>)}
      </div>
      {stats.accountError ? <p role="status" className={styles.notice}>Some account statistics are temporarily unavailable; “—” means unverified, not zero.</p> : null}
    </section>

    <section className={styles.bottomGrid} aria-label="Activity and registration trend">
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>PRESENCE</p><h2>Online now</h2></div><span className={styles.panelSymbol}><PodscapeLineIcon name="community"/></span></div>
        <OnlineNow />
        <details className={styles.info}><summary>How is this counted?</summary><p>Approximate connected browser sessions, not unique members. Idle or hidden tabs may stop contributing, and multiple tabs may count more than once.</p></details>
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>GROWTH</p><h2>Registrations</h2></div><div className={styles.panelTotal}><strong>{format(stats.last7d)}</strong><small>7 days</small></div></div>
        <div className={styles.chart} role="img" aria-label={stats.accountError ? "Recent registration trend unavailable" : stats.registrationsByDay.map(day=>day.day+": "+day.count+" registrations").join(", ")}>
          {stats.registrationsByDay.map(day=><div className={styles.chartColumn} key={day.day}>
            <div className={styles.barTrack}><span className={styles.bar} style={{height:stats.accountError?"0%":(day.count?Math.max(5,(day.count/peak)*100):0)+"%"}} /></div>
            <small>{new Date(day.day+"T12:00:00Z").toLocaleDateString("en-CA",{weekday:"short",timeZone:"UTC"})}</small>
          </div>)}
        </div>
        <details className={styles.info}><summary>About this chart</summary><p>Account creations grouped by UTC day. This is not a visitor or session count.</p></details>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="activity-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>OPERATIONS</p><h2 id="activity-title">Community and access</h2></div></div>
      <div className={styles.secondaryGrid}>
        {[
          {label:"Member profiles",value:stats.memberProfiles,icon:"community" as const},
          {label:"Approved testers",value:stats.approvedTesters,icon:"check" as const},
          {label:"Registrations · 24h",value:stats.last24h,icon:"calendar" as const},
          {label:"Registrations · 30d",value:stats.last30d,icon:"calendar" as const},
        ].map(item=><article className={styles.smallMetric} key={item.label}><PodscapeLineIcon name={item.icon}/><span><strong>{format(item.value)}</strong><small>{item.label}</small></span></article>)}
      </div>
      <p className={styles.privacy}><PodscapeLineIcon name="lock"/> Private owner summary. No member email addresses or individual browsing histories are shown. Bin totals currently include your own colonies; owner/community separation is planned for a dedicated adoption breakdown.</p>
    </section>
  </div></main>;
}
