"use client";
import {useMemo,useState} from "react";
import {createProductFromLedger} from "@/app/admin/products/actions";
import styles from "./ProductLedgerQuickStart.module.css";

export type LedgerChoice={id:string;name:string;scientificName:string;catalogueNumber:string;identityStatus:string};
export function ProductLedgerQuickStart({species}:{species:LedgerChoice[]}){
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState("");
 const filtered=useMemo(()=>species.filter(item=>
   [item.name,item.scientificName,item.catalogueNumber].join(" ").toLowerCase().includes(query.toLowerCase().trim())
 ).slice(0,40),[species,query]);
 const chosen=species.find(item=>item.id===selected);
 return <form action={createProductFromLedger} className={styles.root}>
  <div className={styles.heading}><span className={styles.leaf} aria-hidden="true">❧</span><div><strong>Create from Leaf Ledger</strong><p>Start a linked draft using an existing species.</p></div></div>
  <label htmlFor="ledger-product-search">Search species</label>
  <input id="ledger-product-search" className={styles.search} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, genus, catalogue number..." autoComplete="off"/>
  <label htmlFor="ledger-product-select">Choose a species</label>
  <select id="ledger-product-select" name="speciesId" required value={selected} onChange={e=>setSelected(e.target.value)}>
   <option value="">Select a species...</option>
   {chosen&&!filtered.some(item=>item.id===chosen.id)?<option value={chosen.id}>{chosen.name} · {chosen.scientificName}</option>:null}
   {filtered.map(item=><option value={item.id} key={item.id}>{item.name} · {item.scientificName}</option>)}
  </select>
  {query&&!filtered.length?<p className={styles.note}>No matching species found.</p>:null}
  {chosen?<p className={styles.chosen}><strong>{chosen.name}</strong> · {chosen.catalogueNumber} · {chosen.identityStatus}</p>:null}
  <button type="submit" disabled={!chosen} className={styles.action}>Create linked draft →</button>
  <p className={styles.note}>Prefills name, reference summary and tags. Price, sales writing and product photo remain independent. Nothing is published automatically.</p>
 </form>;
}
