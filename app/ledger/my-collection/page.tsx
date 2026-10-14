import type { Metadata } from "next";
import Link from "next/link";
import { LedgerCollectionTabs } from "@/components/LedgerCollectionTabs";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import styles from "@/components/CollectionControls.module.css";
import { isSpeciesRecordActive } from "@/data/species";
import { PlatformShell } from "@/components/PlatformShell";
import { LedgerPageIntro } from "@/components/LedgerPageIntro";
import layoutStyles from "@/components/LedgerWorkspace.module.css";
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
  const verifiedCount = inCollection.filter((record) => record.identityStatus === "verified").length;

  return <PlatformShell>
    <LedgerPageIntro view="collection" />
    <section className={layoutStyles.workspace}><div className="v2-container">
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
        <LedgerExplorer
          overview={<section className="v2-collection-overview" aria-label="Collection overview">
            <div><span>Species kept</span><strong>{inCollection.length}</strong><small>Saved Leaf Ledger records</small></div>
            <div><span>Genera represented</span><strong>{generaCount}</strong><small>Across your collection</small></div>
            <div><span>Verified records</span><strong>{verifiedCount}</strong><small>Confirmed catalogue identities</small></div>
          </section>}
          records={inCollection}
          collectedIds={member.ids}
          signedIn
          mode="collection"
          addedAtById={addedAtById}
          collectionDetailsById={collectionDetailsById}
        />
      </>}
    </div></section>
  </PlatformShell>;
}
