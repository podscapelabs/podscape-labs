import type { Metadata } from "next";
import Link from "next/link";
import { LedgerExplorer } from "@/components/LedgerExplorer";
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
    <header className={styles.hero} aria-labelledby="ledger-hero-title">
      {featured?.image ? <img src={featured.image} alt="" className={styles.heroPhoto} /> : null}
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroInner}>
        <p className={styles.heroEyebrow}>PODSCAPE / SPECIES ARCHIVE</p>
        <h1 id="ledger-hero-title">Leaf Ledger</h1>
        <p className={styles.heroDescription}>Discover fascinating species, explore their stories, and grow your own collection.</p>
        <nav className={styles.heroActions} aria-label="Leaf Ledger destinations">
          <Link href="#ledger-directory" className={styles.heroActionPrimary} aria-current="page">Discover</Link>
          <Link href="#ledger-directory-search" className={styles.heroAction}>⌕ <span>Search Species</span></Link>
          <Link href={member.signedIn ? "/keeper/collection" : "/account/login"} className={styles.heroAction}>My Collection</Link>
        </nav>
      </div>
    </header>
    <div className={styles.content}><div className="v2-container" id="ledger-directory">
      <LedgerExplorer records={records} collectedIds={member.ids} signedIn={member.signedIn} featured={featured ? {slug:featured.slug,name:speciesDisplayName(featured),summary:featured.summary,image:featured.image}:undefined} />
    </div></div>
  </main></PlatformShell>;
}
