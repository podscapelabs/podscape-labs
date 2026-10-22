import type { Metadata } from "next";
import Link from "next/link";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { LedgerCollectionTabs } from "@/components/LedgerCollectionTabs";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { PlatformShell } from "@/components/PlatformShell";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecords } from "@/lib/species-store";
import styles from "./discover.module.css";

export const metadata: Metadata = { title: "Leaf Ledger | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [speciesRecords, member] = await Promise.all([getSpeciesRecords(), getMemberCollectionState()]);
  const records = speciesRecords.filter(isSpeciesRecordActive);
  // Only showcase genuine, existing species photos; no placeholder or AI-generated media.
  const featured = records.find(record => record.kind === "species" && record.status === "published" && !!record.image && (record.image.startsWith("/") || record.image.startsWith("https://")));
  return <PlatformShell><main className={styles.page}>
    <header className={styles.hero}><div className={`v2-container ${styles.heroInner}`}>
      <p className={styles.eyebrow}>PodScape Labs / Species archive</p>
      <h1 className={styles.title}>Leaf Ledger</h1>
      <p className={styles.description}>Explore the world of isopods. Discover species and build your personal collection.</p>
    </div></header>
    <div className={styles.content}><div className="v2-container">
      <LedgerCollectionTabs active="discover" signedIn={member.signedIn} />
      <LedgerExplorer records={records} collectedIds={member.ids} signedIn={member.signedIn} featured={featured ? {slug:featured.slug,name:speciesDisplayName(featured),summary:featured.summary,image:featured.image}:undefined} />
    </div></div>
  </main></PlatformShell>;
}
