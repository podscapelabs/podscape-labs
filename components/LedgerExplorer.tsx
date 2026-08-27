"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import type { SpeciesRecord } from "@/data/species";

type SortMode = "catalogue" | "common" | "scientific";

export function LedgerExplorer({ records }: { records: SpeciesRecord[] }) {
  const [query, setQuery] = useState("");
  const [genus, setGenus] = useState("all");
  const [sort, setSort] = useState<SortMode>("catalogue");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const genera = useMemo(() => [...new Set(records.map((record) => record.genus))].sort(), [records]);

  const results = useMemo(() => records
    .filter((record) => {
      const haystack = `${record.commonName} ${record.scientificName} ${record.catalogueNumber}`.toLowerCase();
      return (genus === "all" || record.genus === genus) && (!deferredQuery || haystack.includes(deferredQuery));
    })
    .sort((a, b) => {
      if (sort === "common") return a.commonName.localeCompare(b.commonName);
      if (sort === "scientific") return a.scientificName.localeCompare(b.scientificName);
      return a.catalogueNumber.localeCompare(b.catalogueNumber);
    }), [deferredQuery, genus, records, sort]);

  function clear() {
    setQuery("");
    setGenus("all");
    setSort("catalogue");
  }

  return (
    <section className="v2-ledger-explorer" aria-labelledby="ledger-directory-title">
      <div className="v2-filter-bar">
        <label className="v2-search-field">
          <span>Search the catalogue</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Common or scientific name" />
        </label>
        <label><span>Genus</span><select value={genus} onChange={(event) => setGenus(event.target.value)}><option value="all">All genera</option>{genera.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="catalogue">Catalogue number</option><option value="common">Common name</option><option value="scientific">Scientific name</option></select></label>
      </div>
      <div className="v2-results-meta"><span id="ledger-directory-title">{results.length} {results.length === 1 ? "record" : "records"}</span>{query || genus !== "all" || sort !== "catalogue" ? <button type="button" onClick={clear}>Clear filters</button> : <span>Studio records in preparation</span>}</div>
      {results.length ? <div className="v2-species-grid">{results.map((record) => <LedgerSpeciesCard record={record} key={record.id} />)}</div> : <div className="v2-empty-state"><span className="v2-empty-leaf" aria-hidden="true" /><h2>No species match these filters.</h2><button type="button" onClick={clear}>Reset catalogue</button></div>}
    </section>
  );
}
