"use client";
import {useState} from "react";
import styles from "./OwnerQuickFields.module.css";

export function OwnerPresetInput({name,label,initial,options,placeholder}:{
 name:string;label:string;initial:string;options:string[];placeholder?:string
}){
 const [value,setValue]=useState(initial);
 return <label className={styles.input}><span>{label}</span><input type="text" name={name} value={value} onChange={e=>setValue(e.target.value)} list={`studio-${name}`} placeholder={placeholder||"Choose a suggestion or type your own"}/><datalist id={`studio-${name}`}>{options.map(item=><option key={item} value={item}/>)}</datalist><span className={styles.pills}>{options.slice(0,4).map(item=><button type="button" aria-pressed={value===item} onClick={()=>setValue(item)} key={item}>{item}</button>)}</span></label>;
}

export type SpeciesOption={slug:string;label:string;scientificName:string};
export function OwnerSpeciesLinkPicker({initial,species}:{initial:string[];species:SpeciesOption[]}){
 const [selected,setSelected]=useState<string[]>(initial),[query,setQuery]=useState("");
 const matches=species.filter(x=>(x.label+" "+x.scientificName).toLowerCase().includes(query.toLowerCase())).slice(0,15);
 const toggle=(slug:string)=>setSelected(s=>s.includes(slug)?s.filter(x=>x!==slug):[...s,slug]);
 return <div className={styles.picker}>
   <input type="hidden" name="relatedSpeciesSlugs" value={selected.join("\n")}/>
   <label htmlFor="related-species-search">Related Leaf Ledger species</label>
   <input id="related-species-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search species to link..." autoComplete="off"/>
   <div className={styles.pills}>{matches.map(x=><button type="button" key={x.slug} aria-pressed={selected.includes(x.slug)} onClick={()=>toggle(x.slug)}>{selected.includes(x.slug)?"✓ ":"+ "}{x.label}</button>)}</div>
   {selected.length?<div className={styles.chosen}><strong>Linked ({selected.length})</strong>{selected.map(slug=><button type="button" key={slug} onClick={()=>toggle(slug)}>{species.find(s=>s.slug===slug)?.label||slug} ×</button>)}</div>:<p className={styles.help}>No species linked yet.</p>}
   <p className={styles.help}>Links are saved with the guide. This does not change Ledger records.</p>
 </div>;
}
