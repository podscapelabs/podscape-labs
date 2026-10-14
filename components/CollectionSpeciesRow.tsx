import Image from "next/image";
import Link from "next/link";
import { CollectionQuantityControl } from "./CollectionQuantityControl";
import { LeafIcon } from "./PlatformIcons";
import { colonyStatusLabels, type ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";
import styles from "./CollectionRows.module.css";

export function CollectionSpeciesRow({ record, details }: {
  record: SpeciesRecord;
  details?: { quantity: number; colonyStatus: ColonyStatus };
}) {
  const name = speciesDisplayName(record);
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
    {details ? <div className={styles.controls}>
      <span className={styles.status} data-status={details.colonyStatus}>{colonyStatusLabels[details.colonyStatus]}</span>
      <CollectionQuantityControl speciesId={record.id} speciesName={name} initialQuantity={details.quantity} />
    </div> : <div className={styles.controls}><span className={styles.status}>Open keeper record to manage</span></div>}
  </article>;
}
