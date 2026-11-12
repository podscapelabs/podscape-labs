import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { signOutAdmin } from "@/app/admin/actions";
import styles from "./page.module.css";
import { ownerDesks, ownerOperations } from "@/data/owner-desks";
import { TestAchievementButton } from "@/components/TestAchievementButton";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Studio | PodScape Labs", robots: { index: false, follow: false } };

export default async function OwnerToolsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const analytics = ownerOperations.find(item => item.href.endsWith("/analytics"));
  const earlyAccess = ownerOperations.find(item => item.href.includes("early-access"));
  const security = ownerOperations.find(item => item.href.includes("reset-password"));
  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.heading}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PODSCAPE LABS · PRIVATE WORKSPACE</p>
          <h1>Owner Studio</h1>
          <p>Your space to create, manage, and follow the growth of PodScape.</p>
          <div className={styles.heroActions}>
            <Link href={user ? "/account" : "/app"} className={styles.back}>← Back to PodScape</Link>
            {analytics ? <Link href={analytics.href} className={styles.heroAction}>Platform analytics <PodscapeLineIcon name="arrow-right" /></Link> : null}
          </div>
        </div>
        <span className={styles.heroArt} aria-hidden="true"><PodscapeLineIcon name="grid" /></span>
      </header>

      <section className={styles.quickSection} aria-label="Owner quick access">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>AT A GLANCE</p><h2>Quick access</h2></div></div>
        <div className={styles.quickGrid}>
          {[
            { title:"Analytics", subtitle:"Platform pulse", href:"/account/owner-tools/analytics", icon:"community" as const },
            { title:"Species", subtitle:"Leaf Ledger desk", href:"/admin/species", icon:"leaf" as const },
            { title:"Products", subtitle:"Shop management", href:"/admin/products", icon:"shop" as const },
            { title:"Feedback", subtitle:"Member reports", href:"/admin/feedback", icon:"note" as const },
          ].map(item=><Link href={item.href} className={styles.quickCard} key={item.href}>
            <span className={styles.quickIcon}><PodscapeLineIcon name={item.icon}/></span>
            <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
            <PodscapeLineIcon name="arrow-right" />
          </Link>)}
        </div>
      </section>

      <section aria-labelledby="content-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CONTENT STUDIO</p><h2 id="content-heading">Your desks</h2></div><span className={styles.sectionHint}>Manage and publish</span></div>
        <div className={styles.grid}>
          {ownerDesks.map(desk => <Link className={styles.card} href={desk.href} key={desk.href}>
            <span className={styles.symbol} aria-hidden="true"><PodscapeLineIcon name={desk.icon} /></span>
            <span className={styles.copy}><small>{desk.label}</small><strong>{desk.title}</strong><span>{desk.description}</span></span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>

      <section className={styles.other} aria-labelledby="more-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>OPERATIONS</p><h2 id="more-heading">Platform controls</h2></div></div>
        <div className={styles.links}>
          {[earlyAccess,security].filter((item):item is NonNullable<typeof item>=>Boolean(item)).map(item=><Link href={item.href} key={item.href}>
            <span className={styles.operationCopy}><strong><PodscapeLineIcon name={item.icon} /> {item.title}</strong><small>{item.description}</small></span><b aria-hidden="true">→</b>
          </Link>)}
          <details className={styles.qa}><summary><PodscapeLineIcon name="achievement" /> Achievement banner preview <span>Owner QA</span></summary><div><p>Preview the achievement banner without changing EXP or unlocking an achievement.</p><TestAchievementButton /></div></details>
        </div>
      </section>
      <form action={signOutAdmin} className={styles.signOut}><button type="submit">Sign out of owner access</button></form>
    </div>
  </main>;
}
