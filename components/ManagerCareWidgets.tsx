"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import styles from "@/app/keeper/page.module.css";

export type ManagerBin={id:string;name:string;label:string;species:string;quantity:number;status:string;breeding:string;createdAt:string;updatedAt:string};
export type ManagerEvent={id:string;enclosureId:string;enclosureName:string;kind:string;note:string;createdAt:string;quantityChange:number|null};
type Reminder={intervalDays:number;lastMisted:string};
type DueBin=ManagerBin&{days:number|null;intervalDays:number|null};
function careDue(bin:ManagerBin,reminder:Reminder|undefined,now:Date):DueBin{
 const intervalDays=reminder?.intervalDays||null;
 if(!intervalDays||!reminder?.lastMisted)return {...bin,days:null,intervalDays};
 const date=new Date(reminder.lastMisted+"T12:00:00");
 if(Number.isNaN(date.getTime()))return {...bin,days:null,intervalDays};
 date.setDate(date.getDate()+intervalDays);date.setHours(0,0,0,0);
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 return {...bin,intervalDays,days:Math.round((date.getTime()-today.getTime())/86400000)};
}
function dueLabel(days:number|null){return days===null?"Set schedule":days<0?`${Math.abs(days)}d overdue`:days===0?"Due today":`In ${days}d`;}
function displayDate(iso:string){const date=new Date(iso);return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleDateString(undefined,{month:"short",day:"numeric"});}

export function ManagerCareOverview({bins}:{bins:ManagerBin[]}){
 const [reminders,setReminders]=useState<Record<string,Reminder>>({});
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  const next:Record<string,Reminder>={};
  for(const bin of bins)try{
   const record=JSON.parse(localStorage.getItem("podscape-keeper-reminder-"+bin.id)||"null");
   if(record&&Number.isInteger(record.intervalDays)&&record.intervalDays>0&&record.intervalDays<=365)
    next[bin.id]={intervalDays:record.intervalDays,lastMisted:typeof record.lastMisted==="string"?record.lastMisted:""};
  }catch{}
  setReminders(next);setLoaded(true);
 },[bins]);
 const now=new Date();
 const scheduled=bins.map(bin=>careDue(bin,reminders[bin.id],now));
 const due=scheduled.filter(bin=>bin.days!==null&&bin.days<=0).sort((a,b)=>(a.days??0)-(b.days??0));
 const unconfigured=scheduled.filter(bin=>bin.intervalDays===null||bin.days===null);
 return <section className={styles.managerModule} aria-label="Care overview">
  <header><div><p className={styles.managerEyebrow}>YOUR ROUTINE</p><h2>Care overview</h2></div><Link href="/keeper/schedule">Full schedule →</Link></header>
  <div className={styles.managerPulse}>
   <div><strong>{loaded?due.length:"—"}</strong><span>Due or overdue</span></div>
   <div><strong>{loaded?unconfigured.length:"—"}</strong><span>Needs scheduling</span></div>
  </div>
  {!bins.length?<p className={styles.managerModuleEmpty}>Add your first enclosure to start tracking routines.</p>
   :!loaded?<p className={styles.managerModuleEmpty}>Loading your saved schedules…</p>
   :due.length?<div className={styles.managerModuleList}>{due.slice(0,4).map(bin=><Link href={"/keeper/"+bin.id} key={bin.id}><span><strong>{bin.name}</strong><small>{bin.species}</small></span><em>{dueLabel(bin.days)}</em></Link>)}</div>
   :<p className={styles.managerModuleEmpty}>{unconfigured.length?"No misting due. Set schedules for the remaining colonies.":"Nothing due today. You're up to date."}</p>}
  <p className={styles.managerModuleFine}>Based on schedules saved on this device · Not automatic reminders or care advice.</p>
 </section>;
}

export function ManagerActivityFeed({events,available=true}:{events:ManagerEvent[];available?:boolean}){
 return <section className={styles.managerModule} aria-label="Recent care history">
  <header><div><p className={styles.managerEyebrow}>RECENTLY LOGGED</p><h2>Recent activity</h2></div><Link href="/keeper/activity">View activity →</Link></header>
  {!available?<p className={styles.managerModuleEmpty}>Recent activity is not available right now. Your existing logs are unchanged.</p>
   :events.length?<div className={styles.managerModuleList}>{events.slice(0,5).map(event=><Link key={event.id} href={"/keeper/"+event.enclosureId+"/history"}><span><strong>{event.kind.replaceAll("-"," ")}</strong><small>{event.enclosureName}{event.note?" · "+event.note:""}</small></span><em>{displayDate(event.createdAt)}</em></Link>)}</div>
   :<p className={styles.managerModuleEmpty}>No care logs yet. Scan a bin or open an enclosure to record your first activity.</p>}
 </section>;
}

export function ManagerInsights({bins,events}:{bins:ManagerBin[];events:ManagerEvent[]}){
 const breeding=bins.filter(bin=>bin.breeding&&bin.breeding!=="unknown"&&bin.breeding!=="none"&&bin.breeding!=="not-observed").length;
 const records=events.filter(event=>event.quantityChange!==null&&event.quantityChange!==0).length;
 const statusCounts=[...new Set(bins.map(bin=>bin.status).filter(Boolean))].length;
 return <section className={styles.managerModule} aria-label="Colony insights">
  <header><div><p className={styles.managerEyebrow}>YOUR RECORDS</p><h2>Colony insights</h2></div><Link href="/keeper/collection">Explore bins →</Link></header>
  <div className={styles.managerInsightGrid}>
   <div><strong>{breeding}</strong><span>Breeding statuses recorded</span></div>
   <div><strong>{records}</strong><span>Population changes in recent logs</span></div>
   <div><strong>{statusCounts}</strong><span>Colony status categories</span></div>
  </div>
  <p className={styles.managerModuleFine}>Based on your current enclosure fields and recent log entries—not automated population estimates or health assessments.</p>
 </section>;
}
