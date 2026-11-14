"use client";

import {useState,type FormEvent} from "react";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import styles from "./SpeciesProfile.module.css";

export function SpeciesProfileSearch(){
 const [query,setQuery]=useState("");
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const value=query.trim();
  if(!value)return;
  // A full navigation is intentional: this avoids the stalled App Router
  // transition reported from species profiles on iOS standalone.
  window.location.assign("/ledger?q="+encodeURIComponent(value));
 }
 return <form className={styles.ledgerSearchBar} role="search" action="/ledger" method="get" onSubmit={submit}>
  <label htmlFor="species-profile-search">Search the Leaf Ledger</label>
  <div><input id="species-profile-search" name="q" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Species, genus or morph…" autoComplete="off" aria-label="Search species, genus or morph" required />
  <button type="submit"><PodscapeLineIcon name="search"/> Search</button></div>
 </form>;
}
