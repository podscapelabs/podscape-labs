import type { Metadata } from "next";
import Link from "next/link";
import { LedgerCollectionTabs } from "@/components/LedgerCollectionTabs";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import styles from "@/components/CollectionControls.module.css";
import collectionStyles from "@/components/CollectionRows.module.css";
import { isSpeciesRecordActive } from "@/data/species";
import { PlatformShell } from "@/components/PlatformShell";
import { LedgerPageIntro } from "@/components/LedgerPageIntro";
import layout from "@/components/LedgerLayout.module.css";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecords } from "@/lib/species-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Collection | Podscape Leaf Ledger", robots: { index: false, follow: false } };

export default async function MyCollectionPage() {
  const member = await getMemberCollectionState();
  const records = member.signedIn ? await getSpeciesRecords() : [];
  const saved = new Set(member.ids);
  const inCollection = records.filter((record) => saved.has(record.id) && record.kind === "species" && isSpeciesRecordActive(record));
  const addedAtById = Object.fromEntries(member.entries.map((entry) => [entry.speciesId, entry.addedAt]));
  const collectionDetailsById = Object.fromEntries(member.entries.map((entry) => [entry.speciesId, { quantity: entry.quantity, colonyStatus: entry.colonyStatus }]));
  const generaCount = new Set(inCollection.map((record) => record.genus).filter(Boolean)).size;
  const visibleIds = new Set(inCollection.map((record) => record.id));
  const recordedQuantity = member.entries.filter((entry) => visibleIds.has(entry.speciesId)).reduce((total, entry) => total + entry.quantity, 0);

  return <PlatformShell>
    <LedgerPageIntro mode="collection" />
    <section className={layout.content}><div className="v2-container">
      <LedgerCollectionTabs active="collection" signedIn={member.signedIn} />
      {!member.signedIn ? <div className={styles.empty}>
        <h2>Sign in to open your collection.</h2>
        <p>Your personal species list is kept in your member account.</p>
        <Link href="/account/login">Member sign in →</Link>
      </div> : inCollection.length === 0 ? <div className={styles.empty}>
        <h2>Your collection begins in the Ledger.</h2>
        <p>Browse a species record and choose “Add to My Collection” to save it here.</p>
        <Link href="/ledger">Browse Leaf Ledger →</Link>
      </div> : <>
        <section className={collectionStyles.overview} aria-label="Collection overview">
          <div><strong>{inCollection.length}</strong><span>Species</span></div>
          <div><strong>{recordedQuantity}</strong><span>Total quantity</span></div>
          <div><strong>{generaCount}</strong><span>Genera</span></div>
        </section>
        <LedgerExplorer records={inCollection} collectedIds={member.ids} signedIn mode="collection" addedAtById={addedAtById} collectionDetailsById={collectionDetailsById} />
      </>}
    </div></section>
  </PlatformShell>;
}
