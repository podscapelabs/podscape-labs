import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { SpecimenLeaf } from "@/components/SpecimenLeaf";
import { getSpecies, speciesRecords } from "@/data/species";

export function generateStaticParams() { return speciesRecords.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const record = getSpecies((await params).slug); return { title: record ? `${record.commonName} — ${record.scientificName} | Podscape Leaf Ledger` : "Species record", robots: { index: false, follow: false } }; }

export default async function SpeciesPage({ params }: { params: Promise<{ slug: string }> }) {
  const record = getSpecies((await params).slug); if (!record) notFound();
  const care = [["Care level", record.careLevel], ["Moisture", record.moisture], ["Temperature", record.temperature], ["Ventilation", record.ventilation]];
  return <PlatformShell><section className="v2-record-page"><div className="v2-container"><Breadcrumbs items={[{ label: "Leaf Ledger", href: "/ledger" }, { label: record.commonName }]} /><div className="v2-record-hero"><SpecimenLeaf image={record.image} alt={record.scientificName} number={record.catalogueNumber} size="profile" /><div className="v2-record-identity"><p className="v2-label">Specimen record · Draft</p><h1>{record.commonName}</h1><h2><em>{record.scientificName}</em></h2><p>{record.summary}</p><div className="v2-record-meta"><span><small>Catalogue</small><b>{record.catalogueNumber}</b></span><span><small>Genus</small><b>{record.genus}</b></span><span><small>Status</small><b>Studio draft</b></span></div></div></div><section className="v2-record-section"><div><p className="v2-kicker">Husbandry Snapshot</p><h2>Approved care details will appear here.</h2><p>No husbandry values have been inserted before studio review.</p></div><div className="v2-care-grid">{care.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "Not yet entered"}</strong></div>)}</div></section><section className="v2-record-section v2-record-notes"><div><p className="v2-kicker">Keeper Notes</p><h2>A private field journal, planned for a later phase.</h2></div><p>Collection actions, observations, reminders, and personal notes are intentionally not simulated in this first public-platform foundation.</p></section></div></section></PlatformShell>;
}
