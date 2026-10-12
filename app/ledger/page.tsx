import type { Metadata } from "next";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { LedgerCollectionTabs } from "@/components/LedgerCollectionTabs";
import { isSpeciesRecordActive } from "@/data/species";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { getMemberCollectionState } from "@/lib/member-collection";
import { getSpeciesRecords } from "@/lib/species-store";

export const metadata: Metadata = { title: "Leaf Ledger | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [speciesRecords, member] = await Promise.all([
    getSpeciesRecords(),
    getMemberCollectionState(),
  ]);
  return <PlatformShell>
    <PlatformPageHeader eyebrow="Natural-history catalogue · Personal keeper journal" title="Leaf Ledger" intro="Explore the developing species catalogue and save the species you keep to your personal collection." index="LL / 001" />
    <section className="v2-page-section"><div className="v2-container">
      <LedgerCollectionTabs active="discover" signedIn={member.signedIn} />
      <LedgerExplorer records={speciesRecords.filter(isSpeciesRecordActive)} collectedIds={member.ids} signedIn={member.signedIn} />
    </div></section>
  </PlatformShell>;
}
