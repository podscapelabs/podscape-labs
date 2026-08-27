import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { speciesDisplayName, speciesGenus, speciesRecordLabel, speciesScientificName } from "@/data/species";
import { getSpeciesRecord } from "@/lib/species-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const record = await getSpeciesRecord((await params).slug);
  return { title: record ? `${speciesDisplayName(record)} — ${speciesScientificName(record)} | Podscape Leaf Ledger` : "Species record", robots: { index: false, follow: false } };
}

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const record = await getSpeciesRecord((await params).slug);
  if (!record) notFound();
  const care = [["Care level", record.careLevel], ["Moisture", record.moisture], ["Temperature", record.temperature], ["Ventilation", record.ventilation], ["Substrate", record.substrate], ["Feeding", record.feeding]];
  const displayName = speciesDisplayName(record);
  return <PlatformShell><section className="v2-record-page"><div className="v2-container"><Breadcrumbs items={[{ label: "Leaf Ledger", href: "/ledger" }, { label: displayName }]} /><div className="v2-record-hero"><SpecimenLeaf image={record.image} alt={record.imageAlt || speciesScientificName(record)} number={record.catalogueNumber} size="profile" positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} /><div className="v2-record-identity"><p className="v2-label">{speciesRecordLabel(record)}</p><h1>{displayName}</h1><h2><em>{speciesScientificName(record)}</em></h2><p>{record.summary || "This record is awaiting studio-authored notes."}</p><div className="v2-record-meta"><span><small>Catalogue</small><b>{record.catalogueNumber}</b></span><span><small>Genus</small><b>{speciesGenus(record)}</b></span><span><small>Identity</small><b>{record.identityStatus}</b></span></div></div></div><section className="v2-record-section"><div><p className="v2-kicker">Husbandry Snapshot</p><h2>{record.careLevel || record.moisture || record.temperature ? "Care details from the Ledger." : "Approved care details will appear here."}</h2><p>Values remain blank until they have been reviewed in the owner studio.</p></div><div className="v2-care-grid">{care.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "Not yet entered"}</strong></div>)}</div></section><section className="v2-record-section v2-record-notes"><div><p className="v2-kicker">About this record</p><h2>{record.about ? "Field context and identification notes." : "This specimen has not been identified yet."}</h2></div><p>{record.about || "No species identity or natural-history copy has been assigned to this temporary photo test."}</p></section><section className="v2-record-section v2-record-notes"><div><p className="v2-kicker">Keeper Notes</p><h2>Practical observations, carefully separated from identity.</h2></div><p>{record.keeperNotes || "No keeper notes have been entered."}</p></section></div></section></PlatformShell>;
}
