"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import { CollectionSpeciesRow } from "./CollectionSpeciesRow";
import collectionStyles from "./CollectionRows.module.css";
import styles from "./LedgerLayout.module.css";
import spotlight from "@/app/ledger/discover.module.css";
import Link from "next/link";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {LEDGER_BROWSE_ORDER_KEY,LEDGER_EXPLORER_STATE_KEY,type LedgerExplorerSnapshot} from "@/lib/ledger-navigation";
import type { ColonyStatus } from "@/data/collection";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";

type SortMode = "catalogue" | "common" | "scientific" | "recent";

export function LedgerExplorer({ records, collectedIds = [], signedIn = false, mode = "catalogue", addedAtById = {}, collectionDetailsById = {}, featured, heroMode = false }: {
  records: SpeciesRecord[];
  collectedIds?: string[];
  signedIn?: boolean;
  mode?: "catalogue" | "collection";
  addedAtById?: Record<string, string>;
  collectionDetailsById?: Record<string, { quantity: number; colonyStatus: ColonyStatus; binCount?: number }>;
  featured?: { slug: string; name: string; summary: string; image: string | null };
  heroMode?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [genus, setGenus] = useState("all");
  const [care, setCare] = useState("all");
  const [sort, setSort] = useState<SortMode>(mode === "collection" ? "recent" : "catalogue");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const restoredRef=useRef(mode!=="catalogue");
  const [scrollRestored,setScrollRestored]=useState(mode!=="catalogue");
  const pendingScrollRef=useRef<number|null>(null);
  const hydratedRef=useRef(false);
  const didRestoreRef=useRef(false);
  const [restorationReady,setRestorationReady]=useState(false);
  // Restore the exact catalogue view when returning from a species profile.
  useEffect(()=>{
    if(mode!=="catalogue"||didRestoreRef.current)return;
    didRestoreRef.current=true;
    try{
      const raw=sessionStorage.getItem(LEDGER_EXPLORER_STATE_KEY);
      if(raw){
        const saved=JSON.parse(raw) as Partial<LedgerExplorerSnapshot>;
        if(typeof saved.query==="string")setQuery(saved.query);
        if(typeof saved.genus==="string"&&(saved.genus==="all"||records.some(item=>item.genus===saved.genus)))setGenus(saved.genus);
        if(typeof saved.care==="string"&&(saved.care==="all"||records.some(item=>item.careLevel===saved.care)))setCare(saved.care);
        if(["catalogue","common","scientific"].includes(saved.sort||""))setSort(saved.sort as SortMode);
        if(typeof saved.filtersOpen==="boolean")setFiltersOpen(saved.filtersOpen);
        if(typeof saved.scrollY==="number"&&Number.isFinite(saved.scrollY))pendingScrollRef.current=Math.max(0,saved.scrollY);
      }
    }catch{}
    hydratedRef.current=true;
    setRestorationReady(true);
    // Preserve the scroll position until the restored filters have rendered.
    if(pendingScrollRef.current===null){restoredRef.current=true;setScrollRestored(true);}
  },[mode,records]);
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
      return a.catalogueNumber.localeCompare(b.catalogueNumber,"en",{numeric:true,sensitivity:"base"});
    }), [addedAtById, care, deferredQuery, genus, records, sort]);

  const saveBrowseContext=()=>{
    if(mode!=="catalogue")return;
    try{
      const snapshot:LedgerExplorerSnapshot={query,genus,care,sort,filtersOpen,scrollY:window.scrollY};
      sessionStorage.setItem(LEDGER_EXPLORER_STATE_KEY,JSON.stringify(snapshot));
      sessionStorage.setItem(LEDGER_BROWSE_ORDER_KEY,JSON.stringify({slugs:results.map(item=>item.slug)}));
    }catch{}
  };
  useEffect(()=>{
    if(mode!=="catalogue"||!restorationReady||!scrollRestored)return;
    let pendingFrame:number|null=null;
    const save=()=>{
      try{sessionStorage.setItem(LEDGER_EXPLORER_STATE_KEY,JSON.stringify({query,genus,care,sort,filtersOpen,scrollY:window.scrollY} satisfies LedgerExplorerSnapshot));}catch{}
    };
    const queueSave=()=>{
      if(pendingFrame!==null)return;
      pendingFrame=requestAnimationFrame(()=>{pendingFrame=null;save()});
    };
    window.addEventListener("scroll",queueSave,{passive:true});
    window.addEventListener("pagehide",save);
    save();
    return ()=>{
      window.removeEventListener("scroll",queueSave);
      window.removeEventListener("pagehide",save);
      if(pendingFrame!==null)cancelAnimationFrame(pendingFrame);
    };
  },[mode,query,genus,care,sort,filtersOpen,restorationReady,scrollRestored]);
  useEffect(()=>{
    if(mode!=="catalogue"||!restorationReady||restoredRef.current||deferredQuery!==query.trim().toLowerCase())return;
    let second=0;
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{
      window.scrollTo({top:pendingScrollRef.current||0,behavior:"instant"});
      pendingScrollRef.current=null;
      restoredRef.current=true;
      setScrollRestored(true);
    })});
    return ()=>{cancelAnimationFrame(first);cancelAnimationFrame(second)};
  },[mode,deferredQuery,query,results.length,restorationReady]);
  function clear() {
    setQuery("");
    setFiltersOpen(false);
    setGenus("all");
    setCare("all");
    setSort(mode === "collection" ? "recent" : "catalogue");
  }

  const filtersActive = Boolean(query || genus !== "all" || care !== "all" || sort !== (mode === "collection" ? "recent" : "catalogue"));

  return <>
    {heroMode && mode === "catalogue" ? <header className={spotlight.hero} aria-labelledby="ledger-hero-title">
      {featured?.image ? <img src={featured.image} alt="" className={spotlight.heroPhoto} fetchPriority="high" decoding="async" /> : null}
      <div className={spotlight.heroShade} aria-hidden="true" />
      <div className={spotlight.heroInner}>
        <p className={spotlight.heroEyebrow}>PODSCAPE / SPECIES ARCHIVE</p>
        <h1 id="ledger-hero-title">Leaf Ledger</h1>
        <p className={spotlight.heroDescription}>Discover fascinating species, explore their stories, and grow your own collection.</p>
        <div className={spotlight.heroSearch} role="search" aria-label="Search the Leaf Ledger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input type="search" aria-label="Search Leaf Ledger species" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search species, genus, or morph…" autoComplete="off"/>
          {query ? <button type="button" onClick={()=>setQuery("")} aria-label="Clear species search">×</button> : null}
        </div>
        <nav className={spotlight.heroDestinations} aria-label="Leaf Ledger mini dashboard">
          <a href="#ledger-directory" aria-current="page" className={spotlight.heroDestinationActive}><span aria-hidden="true"><PodscapeLineIcon name="leaf"/></span><strong>Discover</strong><small>Explore species</small></a>
          <Link href={signedIn ? "/keeper/collection" : "/account/login"}><span aria-hidden="true">▤</span><strong>My Collection</strong><small>Your saved species</small></Link>
        </nav>
      </div>
    </header> : null}
    <div className={heroMode && mode === "catalogue" ? spotlight.content : undefined}>
    <div className={heroMode && mode === "catalogue" ? "v2-container" : undefined} id={heroMode && mode === "catalogue" ? "ledger-directory" : undefined}>
    <section className="v2-ledger-explorer" aria-labelledby="ledger-directory-title">
    <div className={`v2-filter-bar ${styles.filterBar}`} role="search" aria-label={mode === "collection" ? "Search and filter your collection" : "Search and filter the species catalogue"}>
      {!(heroMode && mode === "catalogue") ? <div className={styles.searchField}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" />
        </svg>
        <input id={mode === "catalogue" ? "ledger-directory-search" : undefined} className={styles.searchInput} aria-label={mode === "collection" ? "Search your collection" : "Search species"} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={mode === "collection" ? "Search your collection…" : "Search species…"} />
        {mode === "catalogue" ? <button className={spotlight.filterToggle} type="button" aria-label={filtersOpen?"Hide species filters":"Show species filters"} aria-expanded={filtersOpen} aria-controls="ledger-filter-options" onClick={() => setFiltersOpen(value => !value)}>
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.5" fill="var(--surface)"/><circle cx="16" cy="17" r="2.5" fill="var(--surface)"/></svg>
          {genus !== "all" || care !== "all" || sort !== "catalogue" ? <span className={spotlight.filterDot} /> : null}
        </button> : null}
      </div> : <button type="button" className={spotlight.catalogueFilterButton} aria-expanded={filtersOpen} aria-controls="ledger-filter-options" onClick={() => setFiltersOpen(value=>!value)}>⚙ {filtersOpen ? "Hide filters" : "Filters & sort"}{genus !== "all" || care !== "all" || sort !== "catalogue" ? " •" : ""}</button>}
      <div id={mode === "catalogue" ? "ledger-filter-options" : undefined} className={`${styles.filterRow} ${mode === "catalogue" ? spotlight.collapsibleFilters : ""}`} hidden={mode === "catalogue" && !filtersOpen}>
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
      <span id="ledger-directory-title" role="status" aria-live="polite" aria-atomic="true">{results.length} {results.length === 1 ? "record" : "records"}</span>
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
      : <div className="v2-species-grid" onClickCapture={event=>{if((event.target as HTMLElement).closest("a[href^=\"/ledger/\"]"))saveBrowseContext()}}>{results.map((record, index) => <LedgerSpeciesCard record={record} key={record.id} showCollectionAction collected={saved.has(record.id)} signedIn={signedIn} collectionDetails={collectionDetailsById[record.id]} />).flatMap((card, index) => {
        const insertSpotlight = index === 3 && !!featured && !filtersActive;
        return insertSpotlight ? [card, <aside key="species-spotlight" className={spotlight.feature} aria-label="Featured species">
          {featured!.image ? <img className={spotlight.featurePhoto} src={featured!.image} alt="" loading="lazy" decoding="async" /> : <span className={spotlight.featureFallback} aria-hidden="true"><PodscapeLineIcon name="leaf"/></span>}
          <div className={spotlight.featureCopy}><small>Featured species</small><h2>{featured!.name}</h2><p>{featured!.summary || "Explore this species in the Leaf Ledger."}</p><Link href={`/ledger/${featured!.slug}`}>View species →</Link></div>
        </aside>] : [card];
      })}{results.length < 4 && featured && !filtersActive ? <aside className={spotlight.feature} aria-label="Featured species">
        {featured.image ? <img className={spotlight.featurePhoto} src={featured.image} alt="" loading="lazy" decoding="async" /> : null}
        <div className={spotlight.featureCopy}><small>Featured species</small><h2>{featured.name}</h2><p>{featured.summary || "Explore this species in the Leaf Ledger."}</p><Link href={`/ledger/${featured.slug}`}>View species →</Link></div>
      </aside> : null}</div>
    ) : <div className="v2-empty-state"><span className="v2-empty-leaf" aria-hidden="true" /><h2>No species match these filters.</h2><p>Try a different name, genus, or care level.</p><button type="button" onClick={clear}>Reset filters</button></div>}
  </section></div></div></>;
}
