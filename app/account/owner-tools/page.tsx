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
export const metadata = { title: "Owner Tools | Podscape Labs", robots: { index: false, follow: false } };

export default async function OwnerToolsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>PODSCAPE LABS / OWNER ACCESS</p>
          <h1>Owner Tools</h1>
          <p>One place to manage the things you&apos;re building.</p>
        </div>
        <Link className={styles.back} href={user ? "/account" : "/app"}>← {user ? "My Podscape" : "Podscape Home"}</Link>
      </header>
      <section aria-labelledby="content-heading">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>CONTENT MANAGEMENT</p><h2 id="content-heading">Your desks</h2></div>
        <div className={styles.grid}>
          {ownerDesks.map(desk => <Link className={styles.card} href={desk.href} key={desk.href}>
            <span className={styles.symbol} aria-hidden="true"><PodscapeLineIcon name={desk.icon} /></span>
            <span className={styles.copy}><small>{desk.label}</small><strong>{desk.title}</strong><span>{desk.description}</span></span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>)}
        </div>
      </section>
      <section className={styles.other} aria-labelledby="more-heading">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>OPERATIONS</p><h2 id="more-heading">Manage access &amp; settings</h2></div>
        <div className={styles.links}>
          {ownerOperations.map(item=><Link href={item.href} key={item.href}><span className={styles.operationCopy}><strong><PodscapeLineIcon name={item.icon} /> {item.title}</strong><small>{item.description}</small></span><b aria-hidden="true">→</b></Link>)}
        </div>
      </section>
      <section aria-label="Owner-only notification test" style={{margin:"18px 0"}}><p style={{fontSize:12,opacity:.75}}>Owner QA · Preview the achievement banner. This test never changes EXP or unlocks an achievement.</p><TestAchievementButton/></section>
      <form action={signOutAdmin} className={styles.signOut}><button type="submit">Sign out of owner access</button></form>
    </div>
  </main>;
}
