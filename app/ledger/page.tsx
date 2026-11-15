import type { Metadata } from "next";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { PlatformShell } from "@/components/PlatformShell";
import { getMemberCollectionState } from "@/lib/member-collection";
import {getApprovedSpeciesPhotos} from "@/lib/approved-species-photos";
import { getSpeciesRecords } from "@/lib/species-store";
import styles from "./discover.module.css";

export const metadata: Metadata = { title: "Leaf Ledger | PodScape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [speciesRecords, member] = await Promise.all([getSpeciesRecords(), getMemberCollectionState()]);
  const records = speciesRecords.filter(record =>
    isSpeciesRecordActive(record) && record.kind === "species" && record.status === "published" &&
    record.identityStatus !== "unassigned" && Boolean(record.commonName.trim() || record.scientificName.trim())
  );
  const approvedPhotosById=await getApprovedSpeciesPhotos(records.map(record=>record.id));
  // Only showcase genuine, existing species photos; no placeholder or AI-generated media.
  const featured = records.find(record => record.kind === "species" && record.status === "published" && !!record.image && (record.image.startsWith("/") || record.image.startsWith("https://")));
  return <PlatformShell><main className={styles.page}>
    <LedgerExplorer heroMode records={records} approvedPhotosById={approvedPhotosById} collectedIds={member.ids} signedIn={member.signedIn} featured={featured ? {slug:featured.slug,name:speciesDisplayName(featured),summary:featured.summary,image:featured.image}:undefined} />
  </main></PlatformShell>;
}
