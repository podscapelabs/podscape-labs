"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import { CollectionSpeciesRow } from "./CollectionSpeciesRow";
import collectionStyles from "./CollectionRows.module.css";
import styles from "./LedgerLayout.module.css";
import type { ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

type SortMode = "catalogue" | "common" | "scientific" | "recent";

export function LedgerExplorer({ records, collectedIds = [], signedIn = false, mode = "catalogue", addedAtById = {}, collectionDetailsById = {} }: {
  records: SpeciesRecord[];
  collectedIds?: string[];
  signedIn?: boolean;
  mode?: "catalogue" | "collection";
  addedAtById?: Record<string, string>;
  collectionDetailsById?: Record<string, { quantity: number; colonyStatus: ColonyStatus; binCount?: number }>;
}) {
  const [query, setQuery] = useState("");
  const [genus, setGenus] = useState("all");
  const [care, setCare] = useState("all");
  const [sort, setSort] = useState<SortMode>(mode === "collection" ? "recent" : "catalogue");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const genera = useMemo(() => [...new Set(records.map((record) => record.genus).filter(Boolean))].sort(), [records]);
  const careLevels = useMemo(() => [...new Set(records.map((record) => record.careLevel).filter(Boolean))].sort(), [records]);
  const saved = useMemo(() => new Set(collectedIds), [collectedIds]);

  const results = useMemo(() => records
    .filter((record) => {
      const haystack = `${speciesDisplayName(record)} ${speciesScientificName(record)} ${record.genus} ${record.species} ${record.morph} ${record.catalogueNumber} ${record.tags.join(" ")}`.toLowerCase();
      return (genus === "all" || record.genus === genus)
        && (care === "all" || record.careLevel === care)
        && (!deferredQuery || haystack.includes(deferredQuery));
    })
    .sort((a, b) => {
      if (sort === "recent") return Date.parse(addedAtById[b.id] || "") - Date.parse(addedAtById[a.id] || "");
      if (sort === "common") return speciesDisplayName(a).localeCompare(speciesDisplayName(b));
      if (sort === "scientific") return speciesScientificName(a).localeCompare(speciesScientificName(b));
      return a.catalogueNumber.localeCompare(b.catalogueNumber);
    }), [addedAtById, care, deferredQuery, genus, records, sort]);

  function clear() {
    setQuery("");
    setGenus("all");
    setCare("all");
    setSort(mode === "collection" ? "recent" : "catalogue");
  }

  const filtersActive = Boolean(query || genus !== "all" || care !== "all" || sort !== (mode === "collection" ? "recent" : "catalogue"));

  return <section className="v2-ledger-explorer" aria-labelledby="ledger-directory-title">
    <div className={`v2-filter-bar ${styles.filterBar}`} role="search" aria-label={mode === "collection" ? "Search and filter your collection" : "Search and filter the species catalogue"}>
      <div className={styles.searchField}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" />
        </svg>
        <input className={styles.searchInput} aria-label={mode === "collection" ? "Search your collection" : "Search species"} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={mode === "collection" ? "Search your collection…" : "Search species…"} />
      </div>
      <div className={styles.filterRow}>
        <label className={styles.filterPill} data-active={genus !== "all"}>
          <select className={styles.filterSelect} aria-label="Filter by genus" value={genus} onChange={(event) => setGenus(event.target.value)}>
            <option value="all">Genus</option>{genera.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.filterPill} data-active={care !== "all"}>
          <select className={styles.filterSelect} aria-label="Filter by care level" value={care} onChange={(event) => setCare(event.target.value)}>
            <option value="all">Care level</option>{careLevels.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.filterPill} data-active={sort !== (mode === "collection" ? "recent" : "catalogue")}>
          <select className={styles.filterSelect} aria-label="Sort species" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            {mode === "collection" ? <option value="recent">Sort: Recent</option> : null}
            <option value="catalogue">Sort: Number</option>
            <option value="common">Sort: Name</option>
            <option value="scientific">Sort: Scientific</option>
          </select>
        </label>
      </div>
    </div>
    <div className={`v2-results-meta ${styles.resultMeta}`}>
      <span id="ledger-directory-title">{results.length} {results.length === 1 ? "record" : "records"}</span>
      <div className={styles.metaActions}>
        {filtersActive ? <button type="button" onClick={clear}>Clear filters</button> : null}
        {mode === "catalogue" ? <details className={styles.legend}>
          <summary>Leaf colour guide</summary>
          <div className={styles.legendPanel}>
            <strong>Understanding the leaves</strong>
            <p><span className={styles.legendSwatch} aria-hidden="true" /> Brown — Not collected</p>
            <p><span className={`${styles.legendSwatch} ${styles.legendSwatchCollected}`} aria-hidden="true" /> Green — In your collection</p>
          </div>
        </details> : null}
      </div>
    </div>
    {results.length ? (mode === "collection"
      ? <div className={collectionStyles.grid}>{results.map((record) => <CollectionSpeciesRow record={record} details={collectionDetailsById[record.id]} key={record.id} />)}</div>
      : <div className="v2-species-grid">{results.map((record) => <LedgerSpeciesCard record={record} key={record.id} showCollectionAction collected={saved.has(record.id)} signedIn={signedIn} collectionDetails={collectionDetailsById[record.id]} />)}</div>
    ) : <div className="v2-empty-state"><span className="v2-empty-leaf" aria-hidden="true" /><h2>No species match these filters.</h2><p>Try a different name, genus, or care level.</p><button type="button" onClick={clear}>Reset filters</button></div>}
  </section>;
}
