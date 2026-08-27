"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { LeafSpeciesCard } from "@/components/LeafSpeciesCard";
import type { SpeciesRecord } from "@/content/species";

export function PodDexExplorer({ records }: { records: SpeciesRecord[] }) {
  const [query, setQuery] = useState("");
  const [genus, setGenus] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const genera = useMemo(() => [...new Set(records.map((record) => record.genus))].sort(), [records]);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchesGenus = genus === "all" || record.genus === genus;
    const searchable = `${record.scientificName} ${record.commonName || ""} ${record.poddexNumber}`.toLowerCase();
    return matchesGenus && (!deferredQuery || searchable.includes(deferredQuery));
  }), [deferredQuery, genus, records]);

  return (
    <section className="poddex-explorer" aria-labelledby="species-directory-title">
      <div className="poddex-tools">
        <div>
          <p className="eyebrow">Species directory</p>
          <h2 id="species-directory-title">Browse the archive.</h2>
        </div>
        <div className="poddex-controls">
          <label>
            <span>Search species</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or PodDex number"
            />
          </label>
          <label>
            <span>Filter by genus</span>
            <select value={genus} onChange={(event) => setGenus(event.target.value)}>
              <option value="all">All genera</option>
              {genera.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="poddex-results-line" aria-live="polite">
        <span>{filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}</span>
        {(query || genus !== "all") ? (
          <button type="button" onClick={() => { setQuery(""); setGenus("all"); }}>Clear filters</button>
        ) : <span>Published and scheduled catalogue entries</span>}
      </div>

      {filteredRecords.length ? (
        <div className="leaf-grid">
          {filteredRecords.map((record) => <LeafSpeciesCard record={record} key={record.id} />)}
        </div>
      ) : (
        <div className="poddex-empty">
          <p>No field records match those filters.</p>
          <button type="button" onClick={() => { setQuery(""); setGenus("all"); }}>Reset archive</button>
        </div>
      )}
    </section>
  );
}
