import Link from "next/link";
import { CollectionButton } from "./CollectionButton";
import styles from "./CollectionControls.module.css";
import { SpecimenLeaf } from "./SpecimenLeaf";
import { colonyStatusLabels, type ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesGenus, speciesRecordLabel, speciesScientificName, type SpeciesRecord } from "@/data/species";

export function LedgerSpeciesCard({ record, compact = false, showCollectionAction = false, collected = false, signedIn = false, collectionDetails }: {
  record: SpeciesRecord;
  compact?: boolean;
  showCollectionAction?: boolean;
  collected?: boolean;
  signedIn?: boolean;
  collectionDetails?: { quantity: number; colonyStatus: ColonyStatus };
}) {
  const card = <Link className={`v2-species-card${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>
    <SpecimenLeaf image={record.image} alt={record.imageAlt || speciesScientificName(record)} number={record.catalogueNumber} size="card" positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} />
    <span className="v2-species-status">{speciesRecordLabel(record)}</span>
    <strong>{speciesDisplayName(record)}</strong>
    <em>{speciesScientificName(record)}</em>
    {!compact ? <small>{speciesGenus(record)} · {record.catalogueNumber}</small> : null}
  </Link>;

  // Keep the clickable card and the mutation button as separate, valid targets.
  if (!showCollectionAction || record.kind !== "species") return card;
  return <article className={styles.tile}>
    {card}
    {collectionDetails ? <div className={styles.collectionMeta} aria-label="Private keeper record summary">
      <span>Quantity <b>{collectionDetails.quantity}</b></span>
      <span>Status <b>{colonyStatusLabels[collectionDetails.colonyStatus]}</b></span>
      <small>Open species to edit keeper record</small>
    </div> : null}
    <CollectionButton speciesId={record.id} speciesName={speciesDisplayName(record)} initialCollected={collected} signedIn={signedIn} />
  </article>;
}
