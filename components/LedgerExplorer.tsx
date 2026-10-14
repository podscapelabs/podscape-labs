"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import styles from "./LedgerWorkspace.module.css";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import type { ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

type SortMode = "catalogue" | "common" | "scientific" | "recent";

export function LedgerExplorer({ records, collectedIds = [], signedIn = false, mode = "catalogue", addedAtById = {}, collectionDetailsById = {}, overview }: {
  records: SpeciesRecord[];
  collectedIds?: string[];
  signedIn?: boolean;
  mode?: "catalogue" | "collection";
  addedAtById?: Record<string, string>;
  collectionDetailsById?: Record<string, { quantity: number; colonyStatus: ColonyStatus }>;
  overview?: ReactNode;
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
  const chevron = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

  return <section className={styles.explorer} aria-labelledby="ledger-directory-title">
    <div className={styles.toolbar}>
      <label className={styles.searchField}>
        <span className={styles.visuallyHidden}>{mode === "collection" ? "Search your collection" : "Search the catalogue"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={mode === "collection" ? "Search your collection…" : "Search species…"} />
      </label>
      <div className={styles.filterChips} role="group" aria-label="Species filters">
        <label className={styles.filterChip}>
          <span className={styles.visuallyHidden}>Filter by genus</span>
          <select value={genus} onChange={(event) => setGenus(event.target.value)}>
            <option value="all">All genera</option>{genera.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
          {chevron}
        </label>
        <label className={styles.filterChip}>
          <span className={styles.visuallyHidden}>Filter by care level</span>
          <select value={care} onChange={(event) => setCare(event.target.value)}>
            <option value="all">Care level</option>{careLevels.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
          {chevron}
        </label>
        <label className={styles.filterChip}>
          <span className={styles.visuallyHidden}>Sort species</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            {mode === "collection" ? <option value="recent">Recently added</option> : null}
            <option value="catalogue">Catalogue</option>
            <option value="common">Common name</option>
            <option value="scientific">Scientific name</option>
          </select>
          {chevron}
        </label>
      </div>
    </div>
    {overview}
    <div className={styles.resultsMeta}>
      <span id="ledger-directory-title" aria-live="polite">{results.length} {results.length === 1 ? "record" : "records"}</span>
      <div className={styles.resultTools}>
        {filtersActive ? <button className={styles.clear} type="button" onClick={clear}>Clear filters</button> : null}
        <details className={styles.legend}>
          <summary>Leaf colour guide <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></svg></summary>
          <div className={styles.legendPanel}>
            <p>Leaf colours show your personal collection status.</p>
            <div className={styles.legendRow}><span className={styles.legendSample} aria-hidden="true" />Brown · Not collected</div>
            <div className={styles.legendRow}><span className={`${styles.legendSample} ${styles.legendSampleCollected}`} aria-hidden="true" />Green · In your collection</div>
          </div>
        </details>
      </div>
    </div>
    {results.length ? <div className="v2-species-grid">{results.map((record) => <LedgerSpeciesCard record={record} key={record.id} showCollectionAction collected={saved.has(record.id)} signedIn={signedIn} collectionDetails={collectionDetailsById[record.id]} />)}</div> : <div className="v2-empty-state"><span className="v2-empty-leaf" aria-hidden="true" /><h2>No species match these filters.</h2><p>Try a different name, genus, or care level.</p><button type="button" onClick={clear}>Reset filters</button></div>}
  </section>;
}
