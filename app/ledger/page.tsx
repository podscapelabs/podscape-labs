import type { Metadata } from "next";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { LedgerCollectionTabs } from "@/components/LedgerCollectionTabs";
import { isSpeciesRecordActive } from "@/data/species";
import { PlatformShell } from "@/components/PlatformShell";
import { LedgerPageIntro } from "@/components/LedgerPageIntro";
import layout from "@/components/LedgerLayout.module.css";
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
    <LedgerPageIntro mode="discover" />
    <section className={layout.content}><div className="v2-container">
      <LedgerCollectionTabs active="discover" signedIn={member.signedIn} />
      <LedgerExplorer records={speciesRecords.filter(isSpeciesRecordActive)} collectedIds={member.ids} signedIn={member.signedIn} />
    </div></section>
  </PlatformShell>;
}
