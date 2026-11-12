"use client";
import {useState} from "react";
import Link from "next/link";
import {CollectionButton} from "./CollectionButton";
import {QuickAddBin} from "./QuickAddBin";
import {binDisplayName} from "@/lib/bin-identity";
import styles from "./SpeciesCollectionHub.module.css";
type Bin={id:string;name:string;label:string;quantity:number;isArchived:boolean};
export function SpeciesCollectionHub({speciesId,speciesName,collected,signedIn,bins,unavailable=false}:{speciesId:string;speciesName:string;collected:boolean;signedIn:boolean;bins:Bin[];unavailable?:boolean}){
 const active=bins.filter(bin=>!bin.isArchived),archived=bins.filter(bin=>bin.isArchived);
 const [selected,setSelected]=useState(active[0]?.id||"");
 const bin=active.find(item=>item.id===selected)||active[0];
 const collectionUrl="/keeper/collection?species="+encodeURIComponent(speciesId);
 return <section id="your-species" className={styles.hub} aria-label="Your collection and bins">
  <div className={styles.heading}><strong>Your collection</strong><CollectionButton speciesId={speciesId} speciesName={speciesName} initialCollected={collected} signedIn={signedIn}/></div>
  {!signedIn?<p><Link href="/account/login">Sign in to save this species and manage your bins →</Link></p>:<>
   <p>{unavailable?"Your bin list is temporarily unavailable.":active.length?active.length+" active "+(active.length===1?"bin":"bins")+" · "+active.reduce((sum,item)=>sum+item.quantity,0).toLocaleString()+" recorded":collected?"Saved for reference · No active bins":"Save for reference, or add your first bin."}</p>
   {active.length>1?<label>Choose your bin<select value={bin?.id||""} onChange={event=>setSelected(event.target.value)}>{active.map(item=><option key={item.id} value={item.id}>{binDisplayName(item)}</option>)}</select></label>:bin?<small>{binDisplayName(bin)}</small>:null}
   <div className={styles.actions}>
    {bin?<><Link href={"/keeper/"+bin.id}>Open bin</Link><Link href={"/keeper/scan?bin="+bin.id+"&mode=care"}>Quick Care</Link></>:null}
    <QuickAddBin speciesId={speciesId} speciesName={speciesName}/>
    <Link href={collectionUrl+"#colonies"}>My Colonies</Link>
    {archived.length?<Link href={collectionUrl+"&view=archived#colonies"}>Archived bins ({archived.length})</Link>:null}
   </div>
  </>}
 </section>;
}
