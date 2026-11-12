"use client";

import { useEffect,useState } from "react";
import {binDisplayName} from "@/lib/bin-identity";
import {speciesMatchesCollectionView} from "@/lib/collection-views";
import {useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import {CollectionButton} from "./CollectionButton";
import {SpeciesQuickCare} from "./SpeciesQuickCare";
import {QuickAddBin} from "@/components/QuickAddBin";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";
import type { Enclosure } from "@/lib/keeper";
import styles from "./ManagerColonies.module.css";

export function ManagerColonies({ records, bins, allBins=bins, collectedIds, intent, initialSpecies, archivedView=false, savedView=false,scope="guest",explicitView=false }: {
  scope?:string;
  explicitView?:boolean;
  records: SpeciesRecord[];
  bins: Enclosure[];
  collectedIds: string[];
  intent?: "notes";
  initialSpecies?:string;
  archivedView?:boolean;
  savedView?:boolean;
  allBins?:{speciesId:string;isArchived:boolean}[];
}) {
  const [tab, setTab] = useState<"species" | "bins">(!savedView&&intent==="notes"?"bins":"species");
  const [query, setQuery] = useState("");
  const [expanded,setExpanded]=useState<string|null>(initialSpecies||null);
  const binHref=(id:string)=>"/keeper/"+id+(intent==="notes"?"?panel=observation#observation":"");
  const [genus, setGenus] = useState("all");
  const [care, setCare] = useState("all");
  const [sort, setSort] = useState("recent");
  const router=useRouter();
  const view=savedView?"saved":archivedView?"archived":"active";
  const storageKey="podscape-colony-browser:"+scope+":"+view;
  const [memoryReady,setMemoryReady]=useState(false);
  useEffect(()=>{
    try{
      const last=sessionStorage.getItem("podscape-colony-view:"+scope);
      if(!explicitView&&last&&["active","saved","archived"].includes(last)&&last!==view){router.replace("/keeper/collection?view="+last);return;}
      sessionStorage.setItem("podscape-colony-view:"+scope,view);
      const raw=sessionStorage.getItem(storageKey),saved=raw?JSON.parse(raw):null;
      if(saved&&typeof saved==="object"){
        if(typeof saved.query==="string")setQuery(saved.query.slice(0,200));
        if(!savedView&&!intent&&["species","bins"].includes(saved.tab))setTab(saved.tab);
        if(typeof saved.genus==="string")setGenus(saved.genus);
        if(typeof saved.care==="string")setCare(saved.care);
        if(["recent","name","count"].includes(saved.sort))setSort(saved.sort);
        if(!initialSpecies&&typeof saved.expanded==="string")setExpanded(saved.expanded);
        if(!initialSpecies&&Number.isFinite(saved.scrollY))requestAnimationFrame(()=>window.scrollTo(0,Math.max(0,saved.scrollY)));
      }
    }catch{/* Browser memory is optional. */}
    setMemoryReady(true);
  },[storageKey,scope,view,explicitView,initialSpecies,intent,router,savedView]);
  useEffect(()=>{
    if(!memoryReady)return;
    let position=window.scrollY;
    const save=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify({query,tab,genus,care,sort,expanded,scrollY:position}));}catch{}};
    save();let timer:ReturnType<typeof setTimeout>|undefined;
    const onScroll=()=>{position=window.scrollY;clearTimeout(timer);timer=setTimeout(save,150)};
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>{clearTimeout(timer);window.removeEventListener("scroll",onScroll);save();};
  },[memoryReady,storageKey,query,tab,genus,care,sort,expanded]);
  const binsBySpecies=new Map<string,Enclosure[]>();
  for(const bin of bins){const group=binsBySpecies.get(bin.speciesId)||[];group.push(bin);binsBySpecies.set(bin.speciesId,group);}
  const speciesTotals=new Map([...binsBySpecies].map(([id,group])=>[id,group.reduce((total,bin)=>total+bin.quantity,0)]));
  const recentFor=(record:SpeciesRecord)=>Math.max(Date.parse(record.updatedAt)||0,...(binsBySpecies.get(record.id)||[]).map(bin=>Date.parse(bin.updatedAt)||0));
  const saved = new Set(collectedIds);
  const entries = records.filter(record => speciesMatchesCollectionView(record.id,savedView?"saved":archivedView?"archived":"active",saved,allBins));
  const speciesMap = new Map(records.map(record => [record.id, record]));
  const genera = [...new Set(entries.map(record => record.genus).filter(Boolean))].sort();
  const careLevels = [...new Set(entries.map(record => record.careLevel).filter(Boolean))].sort();
  const lowered = query.trim().toLowerCase();
  const matching = (name: string) => name.toLowerCase().includes(lowered);
  const visibleSpecies = entries.filter(record =>
    (genus === "all" || record.genus === genus) &&
    (care === "all" || record.careLevel === care) &&
    (!lowered || matching([speciesDisplayName(record), speciesScientificName(record), record.catalogueNumber,...(binsBySpecies.get(record.id)||[]).flatMap(bin=>[bin.name,bin.label])].join(" ")))
  ).sort((a,b) => sort === "name" ? speciesDisplayName(a).localeCompare(speciesDisplayName(b)) : sort === "count" ?
    (speciesTotals.get(b.id)||0) - (speciesTotals.get(a.id)||0) : recentFor(b)-recentFor(a));
  const visibleBins = bins.filter(bin => {
    const record = speciesMap.get(bin.speciesId);
    return !lowered || matching([bin.name, bin.label, record ? speciesDisplayName(record) : ""].join(" "));
  }).sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="count"?b.quantity-a.quantity:Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  function reset(){setQuery("");setGenus("all");setCare("all");setSort("recent");}
  return <section id="colonies" className={styles.section} aria-label="My Colonies">
    <div className={styles.titleRow}><h2>{savedView?"Saved for later":archivedView?"Archived bins":"Your colonies"}</h2>{!savedView?<div className={styles.tabs} role="group" aria-label="Browse collection by">
      <button type="button" className={tab==="species"?styles.selected:""} aria-pressed={tab==="species"} onClick={()=>{setTab("species");reset();}}>Species</button>
      <button type="button" className={tab==="bins"?styles.selected:""} aria-pressed={tab==="bins"} onClick={()=>{setTab("bins");reset();}}>Bins</button>
    </div>:null}</div>
    {intent==="notes"?<p style={{color:"var(--text-secondary)",fontSize:".82rem",margin:"0 0 12px"}}>Select a bin to add a dated observation to its care history.</p>:null}
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
      const owned = binsBySpecies.get(record.id)||[];
      const total = owned.reduce((sum,bin)=>sum+bin.quantity,0);
      const status = owned.find(bin=>bin.isPrimary)?.status || owned[0]?.status;
      const open=expanded===record.id;
      return <article key={record.id} className={styles.speciesGroup}>
        <button type="button" className={styles.card} aria-expanded={open} aria-controls={"species-bins-"+record.id}
          onClick={()=>setExpanded(open?null:record.id)}>
          <span className={styles.photo}>{record.image?<Image src={record.image} alt="" fill sizes="(max-width:700px) 90px,130px" style={{objectFit:"cover",objectPosition:record.imagePositionX+"% "+record.imagePositionY+"%"}}/>:<PodscapeLineIcon name="leaf"/>}</span>
          <span className={styles.cardBody}><strong>{speciesDisplayName(record)}</strong><em>{speciesScientificName(record)}</em>
            <small>{owned.length?archivedView?"Archived bins":"Your active bins":"Saved species · No bins created"}</small>
            {!savedView?<span className={styles.counts}><span><PodscapeLineIcon name="bin"/>{owned.length} {owned.length===1?"bin":"bins"}</span>{owned.length?<span><PodscapeLineIcon name="community"/>{total} recorded</span>:null}</span>:null}
          </span>
          <span className={styles.expandArrow} aria-hidden="true">{open?"⌃":"⌄"}</span>
        </button>
        {open?<div id={"species-bins-"+record.id} className={styles.groupDetails}>
          {owned.length?owned.map(bin=><div className={styles.groupBin} key={bin.id}>
            <Link href={binHref(bin.id)}><strong>{binDisplayName({...bin,label:""})}</strong><small>{bin.label||"No location"} · {bin.quantity} recorded · {bin.status.replaceAll("-"," ")}</small></Link>
            {!archivedView?<Link href={"/keeper/scan?bin="+bin.id+"&mode=care"} className={styles.quickCare} aria-label={"Quick Care for "+bin.name}><PodscapeLineIcon name="droplet"/> Care</Link>:null}
          </div>):<p className={styles.noBins}>This species is saved for reference. No enclosure has been created.</p>}

        </div>:null}
        <div className={styles.groupActions}>
          {!archivedView?<QuickAddBin speciesId={record.id} speciesName={speciesDisplayName(record)} existingNames={owned.map(bin=>bin.name)}/>:null}
          {!archivedView&&owned.length?<SpeciesQuickCare bins={owned.map(({id,name,label})=>({id,name,label}))} speciesName={speciesDisplayName(record)}/>:null}
          {owned.length===1?<Link href={"/keeper/"+owned[0].id}>Open bin</Link>:null}
          {record.status==="published"&&!record.archivedAt?<Link href={"/ledger/"+record.slug}>Species reference</Link>:null}
          {!archivedView?<CollectionButton speciesId={record.id} speciesName={speciesDisplayName(record)} initialCollected={saved.has(record.id)} signedIn compact/>:null}
        </div>
      </article>;
    }) : visibleBins.map(bin=>{
      const record=speciesMap.get(bin.speciesId);
      return <Link className={styles.card} key={bin.id} href={binHref(bin.id)}>
        <span className={styles.photo}>{record?.image?<Image src={record.image} alt="" fill sizes="(max-width:700px) 90px,130px" style={{objectFit:"cover"}}/>:<PodscapeLineIcon name="bin"/>}</span>
        <span className={styles.cardBody}><strong>{binDisplayName({...bin,label:""})}</strong><em>{record?speciesDisplayName(record):"Species record"}</em><small>{bin.label||"Colony record"}</small><span className={styles.counts}><span><PodscapeLineIcon name="community"/>{bin.quantity} count</span></span></span>
        <span className={styles.status}>{bin.status.replaceAll("-"," ")}</span><span className={styles.arrow}>›</span>
      </Link>;
    })}
    {((tab==="species" && !visibleSpecies.length)||(tab==="bins"&&!visibleBins.length))&&<div className={styles.empty}><p>{entries.length?"No matching records.":savedView?"No saved species without bins. Save a species from Leaf Ledger to find it here.":archivedView?"No archived bins.":"No active colonies yet. Add a bin for a saved species to get started."}</p>{entries.length?<button onClick={reset} type="button">Clear filters</button>:<Link href={savedView?"/ledger":"/keeper/collection?view=saved"}>{savedView?"Browse Leaf Ledger →":"View saved species →"}</Link>}</div>}
    </div>
    <div className={styles.actions}><Link href="/keeper/new">＋ Add bin</Link><Link href="/keeper/import">Import spreadsheet</Link><Link href="/ledger">＋ Add species →</Link></div>
  </section>;
}
