"use client";
import {useMemo,useState} from "react";
import styles from "./NotableTraitPicker.module.css";

const PRESETS=[
 {group:"Hobby",values:["beginner","intermediate","advanced","prolific","slow-growing","captive-morph"]},
 {group:"Appearance",values:["spotted","striped","patterned","high-contrast","large","small","spiny","translucent"]},
 {group:"Behaviour",values:["active","secretive","burrowing","climbing","conglobating"]},
 {group:"Reference",values:["porcellio","armadillidium","cubaris","terrestrial","provisional-id"]}
];
function norm(v:string){return v.trim().toLowerCase().replace(/\s+/g,"-").slice(0,35);}
export function SpeciesTagPicker({initialTags=[]}:{initialTags?:string[]}){
 const [selected,setSelected]=useState<string[]>(()=>Array.from(new Set(initialTags.map(norm).filter(Boolean))));
 const [search,setSearch]=useState("");
 const [custom,setCustom]=useState("");
 const options=useMemo(()=>PRESETS.map(group=>({...group,values:group.values.filter(x=>x.includes(search.toLowerCase().trim()))})).filter(g=>g.values.length),[search]);
 const add=(value:string)=>{const tag=norm(value);if(tag&&selected.length<20)setSelected(s=>s.includes(tag)?s:[...s,tag]);};
 const remove=(value:string)=>setSelected(s=>s.filter(tag=>tag!==value));
 return <div className={styles.root}>
  <input type="hidden" name="tags" value={selected.join(", ")}/>
  <div className={styles.top}><strong>Index tags</strong><span>{selected.length} selected</span></div>
  <p className={styles.help}>Select reusable discovery tags or add a specific one. These are search metadata, not independently verified care claims.</p>
  <div className={styles.selected}>{selected.map(tag=><span className={styles.tag} key={tag}>{tag}<button type="button" onClick={()=>remove(tag)} aria-label={`Remove ${tag}`}>×</button></span>)}</div>
  <label className={styles.searchLabel} htmlFor="ledger-tag-search">Find a tag</label>
  <input id="ledger-tag-search" className={styles.search} type="search" placeholder="Search tags…" value={search} onChange={e=>setSearch(e.target.value)}/>
  <div className={styles.groups}>{options.map(group=><section key={group.group}><h4>{group.group}</h4><div className={styles.options}>{group.values.map(tag=><button key={tag} type="button" className={selected.includes(tag)?styles.active:styles.option} aria-pressed={selected.includes(tag)} disabled={selected.length>=20&&!selected.includes(tag)} onClick={()=>selected.includes(tag)?remove(tag):add(tag)}>{selected.includes(tag)?"✓ ":"+ "}{tag}</button>)}</div></section>)}</div>
  <div className={styles.custom}><label htmlFor="ledger-tag-custom">Custom tag <small>when needed</small></label><div><input id="ledger-tag-custom" maxLength={35} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="e.g. orange-morph"/><button type="button" disabled={!custom.trim()||selected.length>=20} onClick={()=>{add(custom);setCustom("");}}>Add</button></div></div>
 </div>;
}
