import { redirect } from "next/navigation";
import type {Metadata} from "next";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {PlatformShell} from "@/components/PlatformShell";
import {
 PodscapePageHeader,PodscapeUtilityHeader,PodscapeButton,PodscapeActionLink,
 PodscapeNavigationCard,PodscapeContentCard,PodscapeDataRow,PodscapeStatusBadge
} from "@/components/design-system/PodscapeUI";
import styles from "./page.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Design System V1 | Owner Studio",robots:{index:false,follow:false,nocache:true}};
export default async function DesignSystemPage(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 return <PlatformShell><div className={styles.page}><div className={styles.wrap}>
  <div className={styles.intro}><p>PRIVATE OWNER STUDIO / COMPONENT PREVIEW</p><h1>PodScape Design System V1</h1><span>Shared visual foundations · Light / dark parity · No public page migration</span></div>
  <section className={styles.section}><h2>Page headers</h2><p className={styles.help}>Discovery surfaces may be expressive. Working spaces remain compact.</p>
   <PodscapePageHeader id="ds-editorial" eyebrow="PODSCAPE LABS / DISCOVER" title="Explore the World" description="An editorial gateway for learning, exploring, and discovering isopods."/>
   <PodscapeUtilityHeader id="ds-utility" eyebrow="MY WORKSPACE" title="My Colonies" description="Your bins, species and care activity." action={<PodscapeActionLink href="/keeper" density="compact">Open Manager →</PodscapeActionLink>}/>
  </section>
  <section className={styles.section}><h2>Actions</h2><p className={styles.help}>One primary action per area, with secondary and destructive controls clearly differentiated.</p>
   <div className={styles.samples}><PodscapeActionLink href="/keeper">Primary · Open Manager →</PodscapeActionLink><PodscapeActionLink href="/fun-zone" variant="secondary">Secondary · Fun Zone</PodscapeActionLink><PodscapeButton variant="quiet" disabled>Quiet · Disabled</PodscapeButton><PodscapeButton variant="danger" disabled>Destructive · Disabled</PodscapeButton></div>
   <p className={styles.note}>Disabled examples intentionally demonstrate styling and do not modify records.</p>
  </section>
  <section className={styles.section}><h2>Cards and data</h2><div className={styles.grid}>
    <PodscapeNavigationCard href="/ledger" icon="❧" title="Leaf Ledger" description="Explore species and your collection."/>
    <PodscapeContentCard title="A Field Note"><p className={styles.copy}>A content card for stories, products, guides, achievements, and featured puzzles.</p><PodscapeStatusBadge tone="info">Informational</PodscapeStatusBadge></PodscapeContentCard>
   </div>
   <div className={styles.rowGroup}><PodscapeDataRow label="Dairy Cow" detail="Bin 01 · Collection record" value="125" href="/keeper"/><PodscapeDataRow label="Maintenance" detail="Your next care entry" value="Not scheduled"/></div>
  </section>
  <section className={styles.section}><h2>Semantic badges</h2><div className={styles.samples}>
   <PodscapeStatusBadge tone="neutral">Coming soon</PodscapeStatusBadge>
   <PodscapeStatusBadge tone="success">Completed</PodscapeStatusBadge>
   <PodscapeStatusBadge tone="info">In progress</PodscapeStatusBadge>
   <PodscapeStatusBadge tone="warning">Needs attention</PodscapeStatusBadge>
   <PodscapeStatusBadge tone="danger">Error</PodscapeStatusBadge>
  </div><p className={styles.note}>Labels are examples. Future integrations must use actual underlying statuses.</p></section>
  <section className={styles.section}><h2>Next QA pass</h2><p className={styles.copy}>Test light and dark themes, keyboard focus, 320–430px mobile widths, and reduced-motion settings before migrating Account and Manager. Existing screens have intentionally not been changed.</p></section>
 </div></div></PlatformShell>;
}
