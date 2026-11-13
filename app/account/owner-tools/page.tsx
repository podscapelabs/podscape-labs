import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { customerSupabase } from "@/lib/customer-auth/server";
import { signOutAdmin } from "@/app/admin/actions";
import styles from "./page.module.css";
import { ownerOperations,ownerDesks } from "@/data/owner-desks";
import {PortalShortcutDock} from "@/components/PortalShortcutDock";
import { OwnerDeskDirectory } from "@/components/OwnerDeskDirectory";
import { TestAchievementButton } from "@/components/TestAchievementButton";
import { OwnerThemeRestoreButton } from "@/components/OwnerThemeRestoreButton";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import {OwnerDeskHeader} from "@/components/OwnerDeskFoundation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Studio | PodScape Labs", robots: { index: false, follow: false } };

export default async function OwnerToolsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const db = await customerSupabase();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };

  const earlyAccess = ownerOperations.find(item => item.href.includes("early-access"));
  const security = ownerOperations.find(item => item.href.includes("reset-password"));
  return <main className={styles.page}>
    <div className={styles.inner}>
      <OwnerDeskHeader area="Platform" title="Owner Studio" description="Manage content, member feedback, analytics and operations from one workspace." icon="grid" backHref={user?"/account":"/app"} backLabel="Back to PodScape" actions={[{href:"#owner-desks",label:"Browse Studio desks",icon:"grid"}]}/>

      <section className={styles.quickSection} aria-label="Owner quick access">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>RIGHT AT HAND</p><h2>Quick actions</h2></div></div>
        <PortalShortcutDock portal="owner-studio" label="Owner Studio shortcuts"
          defaults={["/account/owner-tools/analytics","/admin/feedback","/admin/puzzle-desk","/admin/early-access"]}
          features={[...ownerOperations,...ownerDesks].map(item=>({id:item.href,label:item.title,icon:item.icon,href:item.href}))}/>

      </section>

      <OwnerDeskDirectory />

      <section className={styles.other} aria-labelledby="more-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>OPERATIONS</p><h2 id="more-heading">Platform controls</h2></div></div>
        <div className={styles.links}>
          {[earlyAccess,security].filter((item):item is NonNullable<typeof item>=>Boolean(item)).map(item=><Link href={item.href} key={item.href}>
            <span className={styles.operationCopy}><strong><PodscapeLineIcon name={item.icon} /> {item.title}</strong><small>{item.description}</small></span><b aria-hidden="true">→</b>
          </Link>)}
          <details className={styles.qa}><summary><PodscapeLineIcon name="creative" /> Theme tester <span>Owner QA</span></summary><div><p>Show the floating five-theme switcher for page-by-page visual checks. You can dismiss it again at any time.</p><OwnerThemeRestoreButton /></div></details>
          <details className={styles.qa}><summary><PodscapeLineIcon name="achievement" /> Achievement banner preview <span>Owner QA</span></summary><div><p>Preview the achievement banner without changing EXP or unlocking an achievement.</p><TestAchievementButton /></div></details>
        </div>
      </section>
      <form action={signOutAdmin} className={styles.signOut}><button type="submit">Sign out of owner access</button></form>
    </div>
  </main>;
}
