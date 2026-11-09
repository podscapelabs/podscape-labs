"use client";

import {useEffect,useMemo,useState} from "react";
import styles from "./NotableTraitPicker.module.css";
import {SPECIES_TRAIT_GROUPS,normalizeSpeciesTrait} from "@/lib/species-traits";

const MAX=5;
function tidy(trait:string){return normalizeSpeciesTrait(trait);}
export function NotableTraitPicker({initialTraits=[]}:{initialTraits?:string[]}){
 const [traits,setTraits]=useState<string[]>(()=>Array.from(new Set(initialTraits.map(tidy).filter(Boolean))).slice(0,MAX));
 const [search,setSearch]=useState("");
 const [custom,setCustom]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
  const imported=(event:Event)=>{
   const incoming=(event as CustomEvent<{traits:string[]}>).detail?.traits;
   if(!Array.isArray(incoming))return;
   setTraits(Array.from(new Set(incoming.map(tidy).filter(Boolean))).slice(0,MAX));
   setError("");
  };
  window.addEventListener("podscape-ledger-traits-import",imported);
  return ()=>window.removeEventListener("podscape-ledger-traits-import",imported);
 },[]);

 const matches=useMemo(()=>SPECIES_TRAIT_GROUPS.map(group=>({...group,traits:group.traits.filter(([value,definition])=>(value+" "+definition).toLowerCase().includes(search.trim().toLowerCase()))})).filter(group=>group.traits.length),[search]);
 const add=(value:string)=>{
  const clean=tidy(value);
  if(!clean||traits.some(item=>item.toLowerCase()===clean.toLowerCase()))return;
  if(traits.length>=MAX){setError("Remove a trait before adding another.");return;}
  setTraits(list=>[...list,clean]);setError("");
 };
 const remove=(value:string)=>{setTraits(list=>list.filter(item=>item!==value));setError("");};
 return <div className={styles.root}>
   <input type="hidden" name="notableTraits" value={traits.join("\n")}/>
   <div className={styles.top}><strong>Notable traits</strong><span>{traits.length} / {MAX} selected</span></div>
   <p className={styles.help}>Choose up to five distinctive, evidence-supported characteristics. Feeding traits describe observed behaviour—not a measured nutrient requirement. Nothing is added automatically.</p>
   {traits.length?<ul className={styles.selected}>{traits.map(trait=><li key={trait}><span>{trait}</span><button type="button" onClick={()=>remove(trait)} aria-label={`Remove ${trait}`}>×</button></li>)}</ul>:<p className={styles.empty}>No traits selected; the public block will stay hidden.</p>}
   <label className={styles.searchLabel} htmlFor="ledger-trait-search">Search trait library</label>
   <input id="ledger-trait-search" type="search" className={styles.search} placeholder="Search appearance, behaviour, breeding…" value={search} onChange={event=>setSearch(event.target.value)}/>
   <div className={styles.groups}>{matches.length?matches.map(group=><section key={group.group}><h4>{group.group}</h4><div className={styles.options}>{group.traits.map(([value,definition])=>{const selected=traits.includes(value);return <button type="button" key={value} title={definition} aria-label={value+". "+definition} className={selected?styles.active:styles.option} aria-pressed={selected} disabled={!selected&&traits.length>=MAX} onClick={()=>selected?remove(value):add(value)}>{selected?"✓ ":"+ "}{value}</button>})}</div></section>):<p className={styles.empty}>No matching traits. Add a custom trait below if it is supported.</p>}</div>
   <div className={styles.custom}><label htmlFor="ledger-trait-custom">Need something more specific? <small>Optional custom trait</small></label><div><input id="ledger-trait-custom" maxLength={65} placeholder="Enter a verified characteristic" value={custom} onChange={event=>setCustom(event.target.value)}/><button type="button" disabled={!custom.trim()||traits.length>=MAX} onClick={()=>{add(custom);setCustom("");}}>Add</button></div></div>
   {error?<p className={styles.error} role="alert">{error}</p>:null}
   <p className={styles.help}>Trait labels have definitions (available when focused or hovered). For example, “Strong protein appetite” describes repeated feeding observations, not a proven higher nutritional requirement. Custom traits are preserved.</p>
 </div>;
}
