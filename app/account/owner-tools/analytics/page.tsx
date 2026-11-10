import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOwnerAnalyticsStats } from "@/lib/owner-analytics";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { OnlineNow } from "@/components/OnlineNow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title:"Owner Analytics | PodScape Labs", robots:{ index:false, follow:false } };

function Value({count}:{count:number|null}) {
  return <strong>{count === null ? "—" : count.toLocaleString("en-CA")}</strong>;
}

export default async function OwnerAnalyticsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const stats = await getOwnerAnalyticsStats();
  const peak = Math.max(1,...stats.registrationsByDay.map(item=>item.count));
  return <main className={styles.page}><div className={styles.wrap}>
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>PODSCAPE LABS / OWNER STUDIO</p>
        <h1>Platform Analytics</h1>
        <p>A private glance at how your little world is growing. Live numbers come from PodScape, not estimates or placeholders.</p>
        <Link href="/account/owner-tools" className={styles.back}><PodscapeLineIcon name="arrow-right"/> Owner Tools</Link>
      </div>
      <div className={styles.heroIcon} aria-hidden="true"><PodscapeLineIcon name="community"/></div>
    </header>

    <section className={styles.section} aria-labelledby="overview-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ACCOUNT GROWTH</p><h2 id="overview-title">Your members at a glance</h2></div><span className={styles.detail}>Supabase Auth · live database snapshot</span></div>
      <div className={styles.statsGrid}>
        <article className={styles.metric}><div className={styles.metricIcon}><PodscapeLineIcon name="community"/></div><span>Registered accounts</span><Value count={stats.accounts}/><small>All accounts created in PodScape Auth</small></article>
        <article className={styles.metric}><div className={styles.metricIcon}><PodscapeLineIcon name="check"/></div><span>Confirmed accounts</span><Value count={stats.confirmed}/><small>Users who confirmed their email</small></article>
        <article className={styles.metric}><div className={styles.metricIcon}><PodscapeLineIcon name="calendar"/></div><span>New · last 7 days</span><Value count={stats.last7d}/><small>Account registrations within 7 days</small></article>
        <article className={styles.metric}><div className={styles.metricIcon}><PodscapeLineIcon name="calendar"/></div><span>New · last 30 days</span><Value count={stats.last30d}/><small>Account registrations within 30 days</small></article>
      </div>
      {stats.accountError ? <p role="status" className={styles.notice}>Some account statistics are unavailable. A dash means data could not be confirmed—not zero accounts.</p> : null}
    </section>

    <section className={styles.bottomGrid} aria-label="Live community and registration trend">
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>REALTIME</p><h2>Online Now</h2></div></div>
        <OnlineNow />
        <p className={styles.explanation}>This is the approximate number of active, connected browser sessions. Hidden or idle tabs stop contributing; one person using multiple tabs may count more than once. It is not a unique member count.</p>
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>GROWTH</p><h2>Registrations · 7 days</h2></div><strong className={styles.total}>{stats.last7d === null ? "—" : stats.last7d.toLocaleString("en-CA")}</strong></div>
        <div className={styles.chart} role="img" aria-label={stats.accountError ? "Recent registration trend unavailable" : stats.registrationsByDay.map(day=>day.day+": "+day.count+" registrations").join(", ")}>
          {stats.registrationsByDay.map(day=><div className={styles.chartColumn} key={day.day}>
            <div className={styles.barTrack}><span className={styles.bar} style={{height:stats.accountError?"0%":(day.count?Math.max(5,(day.count/peak)*100):0)+"%"}} /></div>
            <small>{new Date(day.day+"T12:00:00Z").toLocaleDateString("en-CA",{weekday:"short",timeZone:"UTC"})}</small>
          </div>)}
        </div>
        <p className={styles.explanation}>Based on account creation timestamps, grouped by UTC day. The chart shows registrations, not visits.</p>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="activity-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>PLATFORM OPERATIONS</p><h2 id="activity-title">Your platform at a glance</h2></div></div>
      <div className={styles.secondaryGrid}>
        <article className={styles.smallMetric}><PodscapeLineIcon name="community"/><span><strong>{stats.memberProfiles?.toLocaleString("en-CA") ?? "—"}</strong><small>Member profiles</small></span></article>
        <article className={styles.smallMetric}><PodscapeLineIcon name="jar"/><span><strong>{stats.activeBins?.toLocaleString("en-CA") ?? "—"}</strong><small>Active colony bins across members</small></span></article>
        <article className={styles.smallMetric}><PodscapeLineIcon name="check"/><span><strong>{stats.approvedTesters?.toLocaleString("en-CA") ?? "—"}</strong><small>Approved early-access invitations</small></span></article>
        <article className={styles.smallMetric}><PodscapeLineIcon name="calendar"/><span><strong>{stats.last24h?.toLocaleString("en-CA") ?? "—"}</strong><small>Accounts created in 24 hours</small></span></article>
      </div>
      <p className={styles.explanation}>This is an owner-only, aggregate dashboard. It does not publish or display members' emails, identities, or browsing histories. New metrics can be added later as the platform develops.</p>
    </section>
  </div></main>;
}
