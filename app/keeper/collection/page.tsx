import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { ManagerColonies } from "@/components/ManagerColonies";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive } from "@/data/species";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Colonies | PodScape Labs", robots: { index: false, follow: false } };

export default async function MyColoniesPage() {
  const member = await getMemberCollectionState();
  let unavailable = false;
  let bins: Awaited<ReturnType<typeof listEnclosures>> = [];
  let records: Awaited<ReturnType<typeof getSpeciesRecords>> = [];
  if (member.signedIn) {
    try { [records, bins] = await Promise.all([getSpeciesRecords(), listEnclosures()]); }
    catch { unavailable = true; }
  }
  const active = bins.filter(bin => !bin.isArchived);
  const species = records.filter(record => record.kind === "species" && isSpeciesRecordActive(record));
  return <PlatformShell>
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/keeper">← Manager Dashboard</Link></nav>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>MANAGER · YOUR COLLECTION</p>
          <h1>My Colonies</h1>
          <p>Your species, bins and colony records in one place.</p>
        </header>
        {!member.signedIn ? <section className={styles.empty}><h2>Your colonies are private.</h2><p>Sign in to see and manage your records.</p><Link href="/account/login">Sign in →</Link></section>
          : unavailable ? <section className={styles.empty} role="alert"><h2>Colony records are unavailable.</h2><p>Try again when the Keeper database is available.</p></section>
          : <ManagerColonies records={species} bins={active} collectedIds={member.ids} />}
      </div>
    </div>
    {member.signedIn ? <KeeperMobileNav active="keeper"/> : null}
  </PlatformShell>;
}
