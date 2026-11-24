import Link from "next/link";
import type {ApprovedSpeciesPhoto} from "@/lib/approved-species-photos";
import { CollectionButton } from "./CollectionButton";
import styles from "./CollectionControls.module.css";
import { RotatingSpeciesPhoto } from "./RotatingSpeciesPhoto";
import { colonyStatusLabels, type ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

export function LedgerSpeciesCard({ record, compact = false, showCollectionAction = false, collected = false, wished = false, signedIn = false, collectionDetails, nativeNavigation = false, approvedPhotos = [] }: {
  record: SpeciesRecord;
  approvedPhotos?: ApprovedSpeciesPhoto[];
  nativeNavigation?: boolean;
  compact?: boolean;
  showCollectionAction?: boolean;
  collected?: boolean;
  wished?: boolean;
  signedIn?: boolean;
  collectionDetails?: { quantity: number; colonyStatus: ColonyStatus };
}) {
  const cardContent = <>
    <div className={styles.cardPhoto}>
      {record.image || approvedPhotos.length ? <RotatingSpeciesPhoto official={record.image} officialAlt={record.imageAlt || speciesScientificName(record)} approved={approvedPhotos} positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom} /> : <span className={styles.photoPending}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 17 5-5 4 4 4-5 5 6"/></svg>Photo pending</span>}
    </div>
    <strong>{speciesDisplayName(record)}</strong>
    <em>{speciesScientificName(record)}</em>
    <small className={styles.catalogueCode}>{record.catalogueNumber}</small>
  </>;
  // Native links are a reliable escape from stalled client-side transitions on iOS.
  const card = nativeNavigation
    ? <a className={`v2-species-card ${styles.photoCard}${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>{cardContent}</a>
    : <Link className={`v2-species-card ${styles.photoCard}${compact ? " is-compact" : ""}`} href={`/ledger/${record.slug}`}>{cardContent}</Link>;

  // Keep the clickable card and the mutation button as separate, valid targets.
  if (!showCollectionAction || record.kind !== "species") return card;
  return <article className={styles.tile}>
    {card}
    <CollectionButton speciesId={record.id} speciesName={speciesDisplayName(record)} initialCollected={collected} initialWished={wished} signedIn={signedIn} compact statusSelector />
    {collectionDetails ? <p className={styles.collectionSummary} aria-label={`Quantity ${collectionDetails.quantity}, colony status ${colonyStatusLabels[collectionDetails.colonyStatus]}`}>
      <span>Qty ${collectionDetails.quantity}</span><span aria-hidden="true">·</span><span>${colonyStatusLabels[collectionDetails.colonyStatus]}</span>
    </p> : null}
  </article>;
}
