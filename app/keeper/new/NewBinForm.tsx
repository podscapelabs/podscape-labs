"use client";
import {useMemo,useState,useTransition,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {nextBinName} from "@/lib/bin-setup";
import {createEnclosure,createEnclosureBatch} from "@/app/keeper/actions";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import styles from "./page.module.css";

type SpeciesOption={id:string;name:string;scientific:string;existingNames?:string[]};
type Mode="single"|"multiple";
const MAX_BINS=20;
function proposeNames(species:SpeciesOption,count:number){
 const reserved=[...(species.existingNames||[])];
 const result:string[]=[];
 for(let i=0;i<count;i++){
  const next=nextBinName(species.name,reserved);
  reserved.push(next);
  result.push(next);
 }
 return result;
}
export function NewBinForm({species,initialSpeciesId}:{species:SpeciesOption[];initialSpeciesId?:string}){
 const router=useRouter();
 const initial=species.find(item=>item.id===initialSpeciesId);
 const [selected,setSelected]=useState(initial?.id||"");
 const [search,setSearch]=useState(initial?.name||"");
 const [showOptions,setShowOptions]=useState(false);
 const [mode,setMode]=useState<Mode>("single");
 const [quantity,setQuantity]=useState(2);
 const [customName,setCustomName]=useState("");
 const [label,setLabel]=useState("");
 const [error,setError]=useState("");
 const [pending,start]=useTransition();
 const current=species.find(item=>item.id===selected);
 const matches=useMemo(()=>{
  const needle=search.trim().toLowerCase();
  return species.filter(item=>!needle||item.name.toLowerCase().includes(needle)||item.scientific.toLowerCase().includes(needle)).slice(0,12);
 },[species,search]);
 const generated=current?proposeNames(current,mode==="single"?1:quantity):[];
 const singleName=customName.trim()||generated[0]||"";
 const names=mode==="single"?[singleName]:generated;
 const select=(option:SpeciesOption)=>{
  setSelected(option.id);setSearch(option.name);setShowOptions(false);setCustomName("");setError("");
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(pending)return;
  if(!current){setError("Choose a species before creating your bins.");return;}
  if(mode==="multiple"&&(quantity<2||quantity>MAX_BINS)){setError("Choose between 2 and 20 bins.");return;}
  if(names.some(name=>!name.trim()||name.length>80)){setError("Review your bin names.");return;}
  setError("");
  start(async()=>{
   try{
    if(mode==="multiple"){
     const result=await createEnclosureBatch({speciesId:current.id,names,label:label.trim()});
     if(result.success){router.push("/keeper/collection?created="+quantity);router.refresh();}
     else setError(result.error||"Couldn't create these bins.");
    }else{
     const result=await createEnclosure({speciesId:current.id,name:singleName,label:label.trim()});
     if(result.success&&result.id){router.push("/keeper/"+result.id+"?created=1");router.refresh();}
     else setError(result.error||"Couldn't create this bin.");
    }
   }catch{setError("Connection interrupted. Check My Colonies before trying again.");}
  });
 };
 return <form className={styles.form} onSubmit={submit}>
  <div className={styles.step}><span>01</span><div><h2>Choose your species</h2><p>Search the Leaf Ledger. You can add bins for any published species.</p></div></div>
  <div className={styles.searchPicker}>
   <label htmlFor="new-bin-species-search" className={styles.fieldTitle}>Find a species</label>
   <div className={styles.searchControl}>
    <PodscapeLineIcon name="search"/>
    <input id="new-bin-species-search" type="search" autoComplete="off" value={search}
      placeholder="Search common or scientific name…"
      aria-controls="new-bin-species-results"
      onFocus={()=>setShowOptions(true)}
      onChange={event=>{setSearch(event.target.value);setSelected("");setShowOptions(true);setCustomName("");}}
      onKeyDown={event=>{if(event.key==="Escape")setShowOptions(false);if(event.key==="Enter"&&showOptions&&matches.length){event.preventDefault();select(matches[0]);}}}
      disabled={pending}/>
    {search?<button type="button" className={styles.clearSearch} aria-label="Clear species search" onClick={()=>{setSearch("");setSelected("");setShowOptions(true)}}>×</button>:null}
   </div>
   {showOptions?<div className={styles.searchResults} id="new-bin-species-results" role="group" aria-label="Species search results">
    {matches.length?matches.map(item=><button type="button" key={item.id} onClick={()=>select(item)} disabled={pending} className={styles.speciesOption}>
      <span><strong>{item.name}</strong><small>{item.scientific}</small></span>
      {item.id===selected?<PodscapeLineIcon name="check"/>:null}
    </button>):<p>No species match your search. Try a genus or common name.</p>}
    {species.length>12&&!search.trim()?<small className={styles.searchTip}>Start typing to find more species.</small>:null}
   </div>:null}
   {current&&!showOptions?<div className={styles.chosenSpecies}><PodscapeLineIcon name="check"/><span><strong>{current.name}</strong><small>{current.scientific}</small></span><button type="button" onClick={()=>setShowOptions(true)}>Change</button></div>:null}
  </div>
  <p className={styles.helper}>Can&apos;t find it? <Link href="/ledger">Explore the Leaf Ledger →</Link></p>

  <div className={styles.separator}/>
  <div className={styles.step}><span>02</span><div><h2>How many bins?</h2><p>Create one enclosure, or add several for the same species at once.</p></div></div>
  <div className={styles.modePicker} role="group" aria-label="Creation mode">
   <button type="button" disabled={pending} aria-pressed={mode==="single"} onClick={()=>{setMode("single");setError("");}}><PodscapeLineIcon name="jar"/><strong>Single bin</strong><small>One enclosure</small></button>
   <button type="button" disabled={pending} aria-pressed={mode==="multiple"} onClick={()=>{setMode("multiple");setError("");}}><PodscapeLineIcon name="grid"/><strong>Multiple bins</strong><small>Create 2–20 together</small></button>
  </div>
  {mode==="multiple"?<label className={styles.field}>Number of bins
    <input type="number" min={2} max={MAX_BINS} step={1} value={quantity} onChange={event=>setQuantity(Math.min(MAX_BINS,Math.max(2,Math.floor(Number(event.target.value)||2))))} disabled={pending}/>
   </label>:<label className={styles.field}>Bin name <small>Optional — a numbered name is generated automatically</small>
    <input maxLength={80} value={customName} onChange={event=>setCustomName(event.target.value)} disabled={pending} placeholder={generated[0]||"Choose a species first"} autoComplete="off"/>
   </label>}
  <label className={styles.field}>Location <small>Optional · Applied to every new bin</small>
   <input maxLength={70} value={label} onChange={event=>setLabel(event.target.value)} disabled={pending} placeholder="Rack A · Shelf 2"/>
  </label>
  {current?<div className={styles.preview}><strong>{mode==="single"?"Your new bin":"Bins ready to create"}</strong><ul>{names.map((name,index)=><li key={index}><PodscapeLineIcon name="jar"/><span>{name}</span></li>)}</ul>{mode==="multiple"?<small>You can rename each enclosure after creating it.</small>:null}</div>:null}
  {error?<p className={styles.error} role="alert">{error}</p>:null}
  <button type="submit" className={styles.submit} disabled={pending||!current||names.length===0}>{pending?"Creating…":mode==="multiple"?"Create "+quantity+" bins →":"Create bin →"}</button>
  <p className={styles.helper}>Only the bins you create are recorded. Choosing a species does not create an enclosure. The species is also saved in My Collection.</p>
 </form>;
}
