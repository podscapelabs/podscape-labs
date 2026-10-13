"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

type SortMode = "catalogue" | "common" | "scientific" | "recent";

export function LedgerExplorer({ records, collectedIds = [], signedIn = false, mode = "catalogue", addedAtById = {} }: {
  records: SpeciesRecord[];
  collectedIds?: string[];
  signedIn?: boolean;
  mode?: "catalogue" | "collection";
  addedAtById?: Record<string, string>;
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

  return <section className="v2-ledger-explorer" aria-labelledby="ledger-directory-title">
    <div className="v2-filter-bar">
      <label className="v2-search-field">
        <span>{mode === "collection" ? "Search your collection" : "Search the catalogue"}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Common or scientific name" />
      </label>
      <label><span>Genus</span><select value={genus} onChange={(event) => setGenus(event.target.value)}><option value="all">All genera</option>{genera.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label><span>Care level</span><select value={care} onChange={(event) => setCare(event.target.value)}><option value="all">All care levels</option>{careLevels.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>{mode === "collection" ? <option value="recent">Recently added</option> : null}<option value="catalogue">Catalogue number</option><option value="common">Common name</option><option value="scientific">Scientific name</option></select></label>
    </div>
    <div className="v2-results-meta"><span id="ledger-directory-title">{results.length} {results.length === 1 ? "record" : "records"}</span>{query || genus !== "all" || care !== "all" || sort !== (mode === "collection" ? "recent" : "catalogue") ? <button type="button" onClick={clear}>Clear filters</button> : <span>{mode === "collection" ? "Your private archive" : "Leaf Ledger archive"}</span>}</div>
    {results.length ? <div className="v2-species-grid">{results.map((record) => <LedgerSpeciesCard record={record} key={record.id} showCollectionAction collected={saved.has(record.id)} signedIn={signedIn} />)}</div> : <div className="v2-empty-state"><span className="v2-empty-leaf" aria-hidden="true" /><h2>No species match these filters.</h2><p>Try a different name, genus, or care level.</p><button type="button" onClick={clear}>Reset filters</button></div>}
  </section>;
}
