"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./KeeperCollectionHub.module.css";
type Bin={id:string;name:string;species:string;label:string};
type Reminder={intervalDays:number;lastMisted:string};
export function KeeperCareSchedule({bins,embedded=false}:{bins:Bin[];embedded?:boolean}){
 const [records,setRecords]=useState<Record<string,Reminder>>({});
 useEffect(()=>{const next:Record<string,Reminder>={};for(const bin of bins){try{const value=JSON.parse(localStorage.getItem("podscape-keeper-reminder-"+bin.id)||"null");if(value&&Number.isInteger(value.intervalDays)&&value.intervalDays>0)next[bin.id]={intervalDays:value.intervalDays,lastMisted:value.lastMisted||""};}catch{}}setRecords(next);},[bins]);
 const upcoming=bins.map(bin=>{const record=records[bin.id];let due:Date|null=null;if(record?.lastMisted){due=new Date(record.lastMisted+"T12:00:00");if(Number.isNaN(due.getTime()))due=null;else due.setDate(due.getDate()+record.intervalDays);}return{...bin,due,record};}).sort((a,b)=>(a.due?.getTime()??Infinity)-(b.due?.getTime()??Infinity));
 const [savedMessage,setSavedMessage]=useState("");
 function saveInterval(binId:string,value:number){
  if(!Number.isInteger(value)||value<0||value>365)return;
  const key="podscape-keeper-reminder-"+binId;
  try{
   if(value===0){localStorage.removeItem(key);setRecords(old=>{const next={...old};delete next[binId];return next;});}
   else{
    let prior:Record<string,unknown>={};
    try{const stored=JSON.parse(localStorage.getItem(key)||"null");if(stored&&typeof stored==="object"&&!Array.isArray(stored))prior=stored}catch{}
    const previous=records[binId];
    const lastMisted=previous?.lastMisted||"";
    const next={...prior,intervalDays:value,lastMisted,updatedAt:new Date().toISOString()};
    localStorage.setItem(key,JSON.stringify(next));
    setRecords(old=>({...old,[binId]:{intervalDays:value,lastMisted}}));
   }
   setSavedMessage("Schedule saved on this device.");
  }catch{setSavedMessage("Could not save this schedule on this device.")}
 }
 const start=new Date();start.setHours(0,0,0,0);
 if(embedded)return <section aria-label="Care schedule">
  <p className={styles.empty}>Set your misting rotation for each bin. Scheduling is optional and saved on this device only; these are planning dates, not care recommendations.</p>
  {savedMessage?<p role="status" className={styles.empty}>{savedMessage}</p>:null}
  <div className={styles.groups}>{upcoming.length?upcoming.map(bin=>{
   const days=bin.due?Math.ceil((bin.due.getTime()-start.getTime())/86400000):null;
   return <div key={bin.id} className={styles.bin}>
    <span><strong>{bin.species} · {bin.name}</strong><small>{bin.label||"No location"} · {days===null?"Not scheduled":days<0?"Past scheduled date":days===0?"Due today":"In "+days+" days"}</small></span>
    <label className={styles.condition}>Interval <select aria-label={"Misting interval for "+bin.species+" "+bin.name} value={bin.record?.intervalDays||0} onChange={event=>saveInterval(bin.id,Number(event.target.value))}>
     <option value={0}>Not set</option>
     {[1,2,3,4,5,7,10,14,21,30,45,60,90].map(n=><option value={n} key={n}>Every {n}d</option>)}
    </select></label>
   </div>
  }):<p className={styles.empty}>No bins yet. Use Add Bin in your shortcuts to create one.</p>}</div>
  <p className={styles.empty}>Dates advance when you record misting with Quick Care. For advanced per-bin options, open its details.</p>
 </section>;
 return <section className={styles.hub}><div className={styles.top}><div><p className={styles.eyebrow}>KEEPER / YOUR ROUTINE</p><h2>Care schedule</h2><p>A glance at your misting rotation across all bins.</p></div><Link className={styles.scan} href="/keeper/scan">▣ Quick Care</Link></div>
 <p className={styles.empty}>Care intervals are saved on this device only. These are planning dates, not husbandry recommendations or automatic notifications.</p>
 <div className={styles.groups}>{upcoming.length?upcoming.map(bin=>{const days=bin.due?Math.ceil((bin.due.getTime()-start.getTime())/86400000):null;return <Link key={bin.id} className={styles.bin} href={"/keeper/"+bin.id}><span><strong>{bin.species} · {bin.name}</strong><small>{bin.label||"No bin label"}{bin.record?" · Every "+bin.record.intervalDays+" days":""}</small></span><span className={styles.condition}>{days===null?"Not configured":days<0?"Past scheduled date":days===0?"Scheduled today":"In "+days+" days"}</span><span aria-hidden="true">↗</span></Link>}):<p className={styles.empty}>No bins yet. Add your first enclosure from My Collection.</p>}</div>
 <p className={styles.empty}>Misting is logged separately in your care history. Date estimates here update when you save the bin schedule.</p></section>;
}
