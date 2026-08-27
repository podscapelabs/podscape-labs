import Link from "next/link";
import { SpecimenLeaf } from "./SpecimenLeaf";
import { speciesDisplayName, speciesGenus, speciesRecordLabel, speciesScientificName, type SpeciesRecord } from "@/data/species";

export function LedgerSpeciesCard({ record, compact = false }: { record: SpeciesRecord; compact?: boolean }) {
  return (
    <Link className={`v2-species-card${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>
      <SpecimenLeaf image={record.image} alt={record.imageAlt || speciesScientificName(record)} number={record.catalogueNumber} size="card" />
      <span className="v2-species-status">{speciesRecordLabel(record)}</span>
      <strong>{speciesDisplayName(record)}</strong>
      <em>{speciesScientificName(record)}</em>
      {!compact ? <small>{speciesGenus(record)} · {record.catalogueNumber}</small> : null}
    </Link>
  );
}
