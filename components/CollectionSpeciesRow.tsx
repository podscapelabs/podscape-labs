"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustCollectedSpeciesQuantity } from "@/app/ledger/collection/actions";
import Image from "next/image";
import Link from "next/link";
import { LeafIcon } from "./PlatformIcons";
import { colonyStatusLabels, type ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";
import styles from "./CollectionRows.module.css";

export function CollectionSpeciesRow({ record, details }: {
  record: SpeciesRecord;
  details?: { quantity: number; colonyStatus: ColonyStatus; binCount?: number };
}) {
  const name = speciesDisplayName(record);
  const [quantity, setQuantity] = useState(details?.quantity ?? 1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { setQuantity(details?.quantity ?? 1); }, [details?.quantity]);

  function changeQuantity(change: -1 | 1) {
    if (pending || (change === -1 && quantity === 0) || (change === -1 && quantity === 1 && !details?.binCount)) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await adjustCollectedSpeciesQuantity({ speciesId: record.id, change });
        if (!result.success || typeof result.quantity !== "number") {
          setError(result.error || "Couldn't update the count.");
          return;
        }
        setQuantity(result.quantity);
        router.refresh();
      } catch {
        setError("Couldn't update the count. Try again.");
      }
    });
  }

  return <article className={styles.row}>
    <Link href={`/ledger/${record.slug}`} className={styles.speciesLink}
      aria-label={`View ${name} keeper record and species details`}>
      <span className={styles.photo}>
        {record.image
          ? <Image src={record.image} alt={record.imageAlt || name} fill sizes="64px"
              style={{
                objectFit: "cover",
                objectPosition: `${record.imagePositionX}% ${record.imagePositionY}%`,
                transform: `scale(${record.imageZoom || 1})`,
              }} />
          : <LeafIcon />}
      </span>
      <span className={styles.identity}>
        <strong>{name}</strong>
        <em>{speciesScientificName(record)}</em>
        <small>{record.catalogueNumber}</small>
      </span>
      <span className={styles.openArrow} aria-hidden="true">↗</span>
    </Link>
    <div className={styles.controls}>
      <span className={styles.status} data-status={details?.colonyStatus}>
        {details ? colonyStatusLabels[details.colonyStatus] : "Keeper record"}
        {details?.binCount ? ` · ${details.binCount} ${details.binCount === 1 ? "bin" : "bins"}` : null}
      </span>
      <div className={styles.quantityGroup}>
        <span className={styles.quantityLabel}>Qty</span>
        <div className={styles.stepper} role="group" aria-label={`Adjust ${name} quantity`}>
          <button type="button" onClick={() => changeQuantity(-1)} disabled={pending || quantity <= (details?.binCount ? 0 : 1)} aria-label={`Decrease ${name} quantity by one`}>−</button>
          <output aria-live="polite" aria-label={`Quantity ${quantity}`}>{quantity}</output>
          <button type="button" onClick={() => changeQuantity(1)} disabled={pending || quantity >= (details?.binCount ? 99999 : 9999)} aria-label={`Increase ${name} quantity by one`}>+</button>
        </div>
      </div>
      <Link href={`/ledger/${record.slug}#keeper-record`} className={styles.recordLink}>Details <span aria-hidden="true">↗</span></Link>
    </div>
    {error ? <p className={styles.quantityError} role="alert">{error}</p> : null}
    <span className={styles.screenReader} role="status" aria-live="polite">{pending ? `Saving ${name} quantity` : ""}</span>
  </article>;
}
