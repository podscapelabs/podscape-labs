import type { Metadata } from "next";
import Link from "next/link";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { PlatformShell } from "@/components/PlatformShell";
import { KeeperMobileNav } from "@/components/KeeperMobileNav";
import { getMemberCollectionState } from "@/lib/member-collection";
import { listEnclosures } from "@/lib/keeper";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive } from "@/data/species";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Collection | PodScape Labs", robots: { index: false, follow: false } };

export default async function CollectionPage() {
  const member = await getMemberCollectionState();
  const [records, enclosures] = member.signedIn
    ? await Promise.all([getSpeciesRecords(), listEnclosures()])
    : [[], []];
  const saved = new Set(member.ids);
  const collected = records.filter((record) => saved.has(record.id) && record.kind === "species" && isSpeciesRecordActive(record));
  const activeBins = enclosures.filter((enclosure) => !enclosure.isArchived);
  const addedAtById = Object.fromEntries(member.entries.map((entry) => [entry.speciesId, entry.addedAt]));
  const collectionDetailsById = Object.fromEntries(member.entries.map((entry) => {
    const bins = activeBins.filter((bin) => bin.speciesId === entry.speciesId);
    const primary = bins.find((bin) => bin.isPrimary) || bins[0];
    return [entry.speciesId, {
      quantity: bins.length ? bins.reduce((sum, bin) => sum + bin.quantity, 0) : entry.quantity,
      binCount: bins.length,
      colonyStatus: (primary?.status || entry.colonyStatus) as typeof entry.colonyStatus,
    }];
  }));

  return <PlatformShell>
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/keeper">← Manager</Link><span>/</span><span>My Collection</span></nav>
        <header className={styles.heading}>
          <div><p className={styles.eyebrow}>MANAGER · YOUR RECORDS</p><h1>My Collection</h1><p>All your species and colonies, in one place.</p></div>
          <Link className={styles.addButton} href="/ledger">＋ Add species</Link>
        </header>
        {!member.signedIn ? <section className={styles.empty}><h2>Your collection is private.</h2><p>Sign in to see your species, colony counts and personal records.</p><Link href="/account/login">Member sign in →</Link></section> : <>
          <section className={styles.summary} aria-label="Collection overview">
            <div><strong>{collected.length}</strong><span>Species</span></div>
            <div><strong>{activeBins.length}</strong><span>Active bins</span></div>
            <div><strong>{activeBins.reduce((sum, bin) => sum + bin.quantity, 0).toLocaleString()}</strong><span>Recorded in bins</span></div>
          </section>
          <div className={styles.quickLinks}><Link href="/keeper/scan">▣ Scan bin</Link><Link href="/keeper/schedule">▦ Care schedule</Link><Link href="/keeper">⌂ Dashboard</Link></div>
          <div className={styles.listHeading}><h2>Your species</h2><span>{collected.length} saved</span></div>
          {collected.length ? <LedgerExplorer records={collected} collectedIds={member.ids} signedIn mode="collection" addedAtById={addedAtById} collectionDetailsById={collectionDetailsById} /> : <section className={styles.empty}><h2>Nothing in your collection yet.</h2><p>Choose a species from the Leaf Ledger to begin. You can add bins and care records afterwards.</p><Link href="/ledger">Explore species →</Link></section>}
        </>}
      </div>
    </div>
    {member.signedIn ? <KeeperMobileNav active="keeper" /> : null}
  </PlatformShell>;
}
