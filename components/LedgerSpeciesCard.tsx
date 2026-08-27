import Link from "next/link";
import { SpecimenLeaf } from "./SpecimenLeaf";
import type { SpeciesRecord } from "@/data/species";

export function LedgerSpeciesCard({ record, compact = false }: { record: SpeciesRecord; compact?: boolean }) {
  return (
    <Link className={`v2-species-card${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>
      <SpecimenLeaf image={record.image} alt={record.scientificName} number={record.catalogueNumber} size="card" />
      <span className="v2-species-status">Record in preparation</span>
      <strong>{record.commonName}</strong>
      <em>{record.scientificName}</em>
      {!compact ? <small>{record.genus} · {record.catalogueNumber}</small> : null}
    </Link>
  );
}
