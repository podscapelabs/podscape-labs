"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";
import type { Enclosure } from "@/lib/keeper";
import styles from "./ManagerColonies.module.css";

export function ManagerColonies({ records, bins, collectedIds }: {
  records: SpeciesRecord[];
  bins: Enclosure[];
  collectedIds: string[];
}) {
  const [tab, setTab] = useState<"species" | "bins">("species");
  const [query, setQuery] = useState("");
  const [genus, setGenus] = useState("all");
  const [care, setCare] = useState("all");
  const [sort, setSort] = useState("recent");
  const saved = new Set(collectedIds);
  const entries = records.filter(record => saved.has(record.id) || bins.some(bin => bin.speciesId === record.id));
  const speciesMap = new Map(records.map(record => [record.id, record]));
  const genera = [...new Set(entries.map(record => record.genus).filter(Boolean))].sort();
  const careLevels = [...new Set(entries.map(record => record.careLevel).filter(Boolean))].sort();
  const lowered = query.trim().toLowerCase();
  const matching = (name: string) => name.toLowerCase().includes(lowered);
  const visibleSpecies = useMemo(() => entries.filter(record =>
    (genus === "all" || record.genus === genus) &&
    (care === "all" || record.careLevel === care) &&
    (!lowered || matching([speciesDisplayName(record), speciesScientificName(record), record.catalogueNumber].join(" ")))
  ).sort((a,b) => sort === "name" ? speciesDisplayName(a).localeCompare(speciesDisplayName(b)) : sort === "count" ?
    bins.filter(bin=>bin.speciesId===b.id).reduce((s,bin)=>s+bin.quantity,0) - bins.filter(bin=>bin.speciesId===a.id).reduce((s,bin)=>s+bin.quantity,0) : 0),
    [records, bins, collectedIds, genus, care, sort, lowered]);
  const visibleBins = bins.filter(bin => {
    const record = speciesMap.get(bin.speciesId);
    return !lowered || matching([bin.name, bin.label, record ? speciesDisplayName(record) : ""].join(" "));
  }).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="count"?b.quantity-a.quantity:Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  function reset(){setQuery("");setGenus("all");setCare("all");setSort("recent");}
  return <section id="colonies" className={styles.section} aria-label="My Colonies">
    <div className={styles.titleRow}><h2>My Colonies</h2><div className={styles.tabs} role="group" aria-label="Browse collection by">
      <button type="button" className={tab==="species"?styles.selected:""} aria-pressed={tab==="species"} onClick={()=>{setTab("species");reset();}}>Species</button>
      <button type="button" className={tab==="bins"?styles.selected:""} aria-pressed={tab==="bins"} onClick={()=>{setTab("bins");reset();}}>Bins</button>
    </div></div>
    <div className={styles.search}><PodscapeLineIcon name="scan" /><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={tab==="species"?"Search species in your collection…":"Search your bins…"} aria-label="Search your colonies" /></div>
    <div className={styles.filters}>
      {tab==="species" && <>
        <select aria-label="Filter by genus" value={genus} onChange={e=>setGenus(e.target.value)}><option value="all">Genus</option>{genera.map(g=><option value={g} key={g}>{g}</option>)}</select>
        <select aria-label="Filter by care level" value={care} onChange={e=>setCare(e.target.value)}><option value="all">Care level</option>{careLevels.map(c=><option key={c} value={c}>{c}</option>)}</select>
      </>}
      <select aria-label="Sort records" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Sort: Recent</option><option value="name">Sort: Name</option><option value="count">Sort: Count</option></select>
    </div>
    <div className={styles.cards}>
    {tab==="species" ? visibleSpecies.map(record=>{
      const owned = bins.filter(bin=>bin.speciesId===record.id);
      const total = owned.reduce((sum,bin)=>sum+bin.quantity,0);
      const status = owned.find(bin=>bin.isPrimary)?.status || owned[0]?.status;
      const href = owned[0] ? "/keeper/"+owned[0].id : "/ledger/"+record.slug+"#keeper-record";
      return <Link className={styles.card} href={href} key={record.id}>
        <span className={styles.photo}>{record.image?<Image src={record.image} alt="" fill sizes="(max-width:700px) 90px,130px" style={{objectFit:"cover",objectPosition:record.imagePositionX+"% "+record.imagePositionY+"%"}}/>:<PodscapeLineIcon name="leaf"/>}</span>
        <span className={styles.cardBody}><strong>{speciesDisplayName(record)}</strong><em>{speciesScientificName(record)}</em><small>{record.catalogueNumber}</small>
          <span className={styles.counts}><span><PodscapeLineIcon name="bin"/>{owned.length} {owned.length===1?"bin":"bins"}</span><span><PodscapeLineIcon name="community"/>{owned.length?total:"—"} count</span></span>
        </span>
        {status?<span className={styles.status}>{status.replaceAll("-"," ")}</span>:null}<span className={styles.arrow}>›</span>
      </Link>;
    }) : visibleBins.map(bin=>{
      const record=speciesMap.get(bin.speciesId);
      return <Link className={styles.card} key={bin.id} href={"/keeper/"+bin.id}>
        <span className={styles.photo}>{record?.image?<Image src={record.image} alt="" fill sizes="(max-width:700px) 90px,130px" style={{objectFit:"cover"}}/>:<PodscapeLineIcon name="bin"/>}</span>
        <span className={styles.cardBody}><strong>{bin.name}</strong><em>{record?speciesDisplayName(record):"Species record"}</em><small>{bin.label||"Colony record"}</small><span className={styles.counts}><span><PodscapeLineIcon name="community"/>{bin.quantity} count</span></span></span>
        <span className={styles.status}>{bin.status.replaceAll("-"," ")}</span><span className={styles.arrow}>›</span>
      </Link>;
    })}
    {((tab==="species" && !visibleSpecies.length)||(tab==="bins"&&!visibleBins.length))&&<div className={styles.empty}><p>{entries.length||bins.length?"No matching records.":"Your collection is ready for its first species."}</p>{entries.length||bins.length?<button onClick={reset} type="button">Clear filters</button>:<Link href="/ledger">Browse Leaf Ledger →</Link>}</div>}
    </div>
    <div className={styles.actions}><Link href="/ledger">＋ Add species</Link>{tab==="bins"?<Link href="/ledger/my-collection">Choose species to add a bin →</Link>:null}</div>
  </section>;
}
