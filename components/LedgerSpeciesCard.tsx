import Link from "next/link";
import { CollectionButton } from "./CollectionButton";
import styles from "./CollectionControls.module.css";
import { SpecimenLeaf } from "./SpecimenLeaf";
import { colonyStatusLabels, type ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

export function LedgerSpeciesCard({ record, compact = false, showCollectionAction = false, collected = false, signedIn = false, collectionDetails }: {
  record: SpeciesRecord;
  compact?: boolean;
  showCollectionAction?: boolean;
  collected?: boolean;
  signedIn?: boolean;
  collectionDetails?: { quantity: number; colonyStatus: ColonyStatus };
}) {
  const card = <Link className={`v2-species-card${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>
    <SpecimenLeaf image={record.image} alt={record.imageAlt || speciesScientificName(record)} number={record.catalogueNumber} size="card" positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} revivable={showCollectionAction && record.kind === "species"} />
    <strong>{speciesDisplayName(record)}</strong>
    <em>{speciesScientificName(record)}</em>
  </Link>;

  // Keep the clickable card and the mutation button as separate, valid targets.
  if (!showCollectionAction || record.kind !== "species") return card;
  return <article className={styles.tile}>
    {card}
    <CollectionButton speciesId={record.id} speciesName={speciesDisplayName(record)} initialCollected={collected} signedIn={signedIn} compact />
    {collectionDetails ? <p className={styles.collectionSummary} aria-label={`Quantity ${collectionDetails.quantity}, colony status ${colonyStatusLabels[collectionDetails.colonyStatus]}`}>
      <span>Qty ${collectionDetails.quantity}</span><span aria-hidden="true">·</span><span>${colonyStatusLabels[collectionDetails.colonyStatus]}</span>
    </p> : null}
  </article>;
}
