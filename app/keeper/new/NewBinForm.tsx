"use client";
import {useState,useTransition,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {nextBinName} from "@/lib/bin-setup";
import {createEnclosure} from "@/app/keeper/actions";
import styles from "./page.module.css";

type SpeciesOption={id:string;name:string;scientific:string;existingNames?:string[]};

export function NewBinForm({species,initialSpeciesId}:{species:SpeciesOption[];initialSpeciesId?:string}){
 const router=useRouter();
 const [speciesId,setSpeciesId]=useState(species.some(x=>x.id===initialSpeciesId)?initialSpeciesId!:species[0]?.id||"");
 const current=species.find(item=>item.id===speciesId);
 const [name,setName]=useState(()=>nextBinName(current?.name||"New",current?.existingNames||[]));
 const [label,setLabel]=useState("");
 const [error,setError]=useState("");
 const [pending,start]=useTransition();
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending)return;
  setError("");
  start(async()=>{
   try{
    const result=await createEnclosure({speciesId,name:name.trim(),label:label.trim()});
    if(result.success&&result.id){router.push("/keeper/"+result.id+"?created=1");router.refresh();}
    else setError(result.error||"Unable to create this bin. Please try again.");
   }catch{setError("Unable to create this bin right now. Please try again.");}
  });
 }
 return <form className={styles.form} onSubmit={submit}>
  <div className={styles.step}><span>01</span><div><h2>Select a species</h2><p>Choose any published species. Creating a bin also saves it to My Collection.</p></div></div>
  <label className={styles.field}>Species
   <select required value={speciesId} onChange={event=>{const next=species.find(item=>item.id===event.target.value);if(name===nextBinName(current?.name||"New",current?.existingNames||[]))setName(nextBinName(next?.name||"New",next?.existingNames||[]));setSpeciesId(event.target.value)}}>
    {species.map(item=><option key={item.id} value={item.id}>{item.name}{item.scientific?" · "+item.scientific:""}</option>)}
   </select>
  </label>
  <p className={styles.helper}>Looking for a species? <Link href="/ledger">Explore Leaf Ledger →</Link></p>
  <div className={styles.separator}/>
  <div className={styles.step}><span>02</span><div><h2>Name your bin</h2><p>Use a name you’ll recognize on your labels and care records.</p></div></div>
  <label className={styles.field}>Bin or enclosure name
   <input required minLength={1} maxLength={80} value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Panda King · Bin A04" autoComplete="off"/>
  </label>
  <label className={styles.field}>Location (optional)<input maxLength={70} value={label} onChange={event=>setLabel(event.target.value)} placeholder="e.g. Rack A · Shelf 2"/></label>
  {error?<p className={styles.error} role="alert">{error}</p>:null}
  <button type="submit" className={styles.submit} disabled={pending||!speciesId||!name.trim()}>{pending?"Creating bin…":"Create bin →"}</button>
  <p className={styles.helper}>No bin is created by simply saving a species. Your new bin appears in My Colonies with its own history.</p>
 </form>;
}
