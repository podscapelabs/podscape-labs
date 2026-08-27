import type { Metadata } from "next";
import { LedgerExplorer } from "@/components/LedgerExplorer";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { getSpeciesRecords } from "@/lib/species-store";

export const metadata: Metadata = { title: "Leaf Ledger | Podscape Labs", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const speciesRecords = await getSpeciesRecords();
  return <PlatformShell><PlatformPageHeader eyebrow="Natural-history catalogue · Personal keeper journal" title="Leaf Ledger" intro="Browse the developing species catalogue. Personal collections, notes, and reminders will join the Ledger in later phases." index="LL / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-ledger-tabs" aria-label="Leaf Ledger views"><span className="is-active">Discover</span><span title="Planned for Phase 2">My Collection · Later</span></div><LedgerExplorer records={speciesRecords} /></div></section></PlatformShell>;
}
