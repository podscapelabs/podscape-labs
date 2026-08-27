import Link from "next/link";
import { formatPodDexNumber, type SpeciesRecord } from "@/content/species";

export function LeafSpeciesCard({ record, compact = false }: { record: SpeciesRecord; compact?: boolean }) {
  return (
    <Link
      className={`leaf-card${compact ? " leaf-card-compact" : ""}`}
      data-genus={record.genus}
      href={`/poddex/species/${record.slug}`}
      aria-label={`${record.scientificName}, ${formatPodDexNumber(record.poddexNumber)}`}
    >
      <div className="leaf-card-shape">
        <span className="leaf-card-vein" aria-hidden="true" />
        <span className="leaf-card-number">{formatPodDexNumber(record.poddexNumber)}</span>
        <span className="leaf-card-specimen" aria-hidden="true">
          <b>{record.genus.slice(0, 1)}</b>
          <small>archive specimen</small>
        </span>
        <span className={`leaf-card-status leaf-card-status-${record.status}`}>
          {record.status === "scheduled" ? "Coming soon" : "Catalogued"}
        </span>
      </div>
      <div className="leaf-card-copy">
        <p>{record.commonName || "Field record"}</p>
        <h3><i>{record.scientificName.split(" ")[0]}</i> {record.scientificName.split(" ").slice(1).join(" ")}</h3>
        <span>{record.releaseWave}</span>
      </div>
    </Link>
  );
}
