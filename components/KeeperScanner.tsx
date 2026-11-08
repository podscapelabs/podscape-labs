"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import jsQR from "jsqr";
import { logKeeperEvent, undoKeeperEvent } from "@/app/keeper/actions";
import styles from "./KeeperScanner.module.css";
type Bin = { id:string; name:string; label:string; species:string; quantity:number; image:string|null };
type DetectedCode = { rawValue:string };
type QRDetector = { detect:(source:HTMLVideoElement)=>Promise<DetectedCode[]> };
type QRConstructor = new (options:{formats:string[]})=>QRDetector;
function readId(value:string):string|null {
 const raw=value.trim();
 if (/^[a-f\d-]{36}$/i.test(raw)) return raw;
 try {const url=new URL(raw);if(url.protocol!=="https:"&&url.protocol!=="http:")return null;const path=url.pathname.match(/\/(?:keeper|bins?)\/([a-f\d-]{36})(?:\/|$)/i);return path?.[1]||url.searchParams.get("bin")||null;}catch{return null;}
}
const tasks=[{label:"Misted",kind:"maintenance",note:"Misted",icon:"◌"},{label:"Fed",kind:"feeding",note:"Fed",icon:"◈"},{label:"Spot cleaned",kind:"maintenance",note:"Spot cleaned",icon:"✧"},{label:"Leaf litter",kind:"maintenance",note:"Leaf litter added",icon:"❧"}] as const;
type CareRecord={id:string;binId:string;label:string;note:string;createdAt:string;previous:string|null};
function formatLast(value:string|null|undefined){
 if(!value)return "Never logged";
 const date=new Date(value);if(Number.isNaN(date.getTime()))return "Never logged";
 const now=new Date();if(date.toDateString()===now.toDateString())return "Today · "+date.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
 return date.toLocaleDateString(undefined,{month:"short",day:"numeric",...(date.getFullYear()===now.getFullYear()?{}:{year:"numeric" as const})});
}
export function KeeperScanner({bins,initialBinId="",startManual=false,careDates={}}:{bins:Bin[];initialBinId?:string;startManual?:boolean;careDates?:Record<string,Record<string,string>>}){
 const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const lock=useRef(false);
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const saving=useRef(false);
 const [selected,setSelected]=useState<Bin|null>(()=>bins.find(b=>b.id===initialBinId)||null);const [state,setState]=useState<"idle"|"scanning">(initialBinId||startManual?"idle":"scanning");const [error,setError]=useState("");const [choice,setChoice]=useState("");const [pending,start]=useTransition();
 const [customNote,setCustomNote]=useState("");const [customDate,setCustomDate]=useState("");const [manual,setManual]=useState(initialBinId);
 const [recent,setRecent]=useState<CareRecord[]>([]);
 const [lastDates,setLastDates]=useState<Record<string,Record<string,string>>>(careDates);
 const [notice,setNotice]=useState("");
 const [undoPending,setUndoPending]=useState(false);
 const [showManual,setShowManual]=useState(false);
 const sessionCount=recent.length;
 const noticeRef=useRef<HTMLDivElement>(null);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;canvas.current=null;};
 function match(value:string){const id=readId(value);const found=bins.find(b=>b.id.toLowerCase()===id?.toLowerCase());if(found){lock.current=true;stop();setSelected(found);setState("idle");setCustomNote("");setCustomDate("");setError("");return true;}setError("That code does not match an active bin in your collection.");return false;}
 useEffect(()=>()=>stop(),[]);
 useEffect(()=>{if(state!=="scanning")return;let live=true;let timer:ReturnType<typeof setInterval>|undefined;
 async function begin(){try{
 const ctor=(window as unknown as {BarcodeDetector?:QRConstructor}).BarcodeDetector;
 const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
 if(!live){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
 if(!video.current){stop();return;}video.current.srcObject=media;await video.current.play();
 const detector=ctor?new ctor({formats:["qr_code"]}):null;
 if(!detector) canvas.current=document.createElement("canvas");
 let busy=false;
 timer=setInterval(async()=>{if(busy||lock.current||!video.current||video.current.readyState<2)return;busy=true;try{
   let value:string|undefined;
   if(detector){const codes=await detector.detect(video.current);value=codes[0]?.rawValue;}
   else {
     const frame=canvas.current;const source=video.current;
     if(frame&&source.videoWidth&&source.videoHeight){
       const scale=Math.min(1,720/source.videoWidth);
       frame.width=Math.round(source.videoWidth*scale);frame.height=Math.round(source.videoHeight*scale);
       const context=frame.getContext("2d",{willReadFrequently:true});
       if(context){context.drawImage(source,0,0,frame.width,frame.height);const pixels=context.getImageData(0,0,frame.width,frame.height);value=jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:"attemptBoth"})?.data;}
     }
   }
   if(live&&value)match(value);
 }catch{}finally{busy=false;}},300);
 }catch{setError("Camera unavailable. Check permissions or choose a bin manually.");setState("idle");}}
 begin();return()=>{live=false;if(timer)clearInterval(timer);stop();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[state]);
 function beginScan(){lock.current=false;setSelected(null);setNotice("");setChoice("");setError("");setState("scanning");}
 function save(kind:string,note:string,label:string,occurredOn?:string){
 if(!selected||pending||saving.current)return;
 // A checked tile is a successful save in this session, not a toggle to delete.
 if(tasks.some(t=>t.label===label)&&recent.some(r=>r.binId===selected.id&&r.label===label)){setNotice(label+" already logged this session. Use Undo to correct it.");return;}
 saving.current=true;setError("");setChoice(label);
 const bin=selected;
 start(async()=>{try{
  const result=await logKeeperEvent({id:bin.id,kind,note,occurredOn});
  if(result.success&&result.id){
   const previous=lastDates[bin.id]?.[note]||null;
   const createdAt=occurredOn?occurredOn+"T12:00:00Z":new Date().toISOString();
   setRecent(r=>[...r,{id:result.id!,binId:bin.id,label,note,createdAt,previous}]);
   setLastDates(d=>({...d,[bin.id]:{...(d[bin.id]||{}),[note]:createdAt}}));
   setNotice(label+" saved");
   if(kind==="observation")setCustomNote("");
  }else setError(result.error||"Save failed. Please retry.");
 }catch{setError("Unable to save care. Please retry.");}finally{saving.current=false;}});
 }
 async function undo(){
  const entry=recent[recent.length-1];if(!entry||undoPending||pending)return;
  setUndoPending(true);setError("");
  try{
   const result=await undoKeeperEvent({id:entry.id,enclosureId:entry.binId});
   if(!result.success){setError(result.error||"Undo failed.");return;}
   setRecent(r=>r.filter(x=>x.id!==entry.id));
   setLastDates(d=>({...d,[entry.binId]:{...(d[entry.binId]||{}),[entry.note]:entry.previous||""}}));
   setNotice(entry.label+" undone");
  }catch{setError("Undo failed. Please retry.");}finally{setUndoPending(false);}
 }
 const latest=recent[recent.length-1]||null;
 const loggedForBin=selected?recent.filter(r=>r.binId===selected.id):[];
 return <section className={styles.wrap}>
 {state!=="scanning"&&!selected?<div className={styles.heading}><div><p className={styles.kicker}>PODSCAPE LABS / KEEPER</p><h1>Quick Care</h1><p>Scan a bin, log care, and move on.</p></div><Link href="/ledger/my-collection">My Collection ↗</Link></div>:null}
 {state==="scanning"?<div className={styles.camera}><video ref={video} muted playsInline aria-label="QR scanning camera"/><div className={styles.brackets} aria-hidden="true"><span/><span/><span/><span/></div></div>:null}
 {state==="scanning"?<div className={styles.scanBelow}><p>Position your bin QR code within the corners.</p><button type="button" onClick={()=>setState("idle")}>Choose a bin manually →</button></div>:null}
 {state==="idle"&&!selected?<div className={styles.panel}><div className={styles.scanIcon}>▣</div><h2>{startManual?"Choose a bin to log care":"Ready to scan"}</h2><p>Select an enclosure or scan its QR label.</p><div className={styles.manualPicker}><select value={manual} onChange={e=>setManual(e.target.value)} aria-label="Choose enclosure to log care"><option value="">Select a bin</option>{bins.map(b=><option key={b.id} value={b.id}>{b.species} — {b.name}</option>)}</select><button type="button" disabled={!manual} onClick={()=>match(manual)}>Open bin</button></div><button className={styles.primary} type="button" onClick={beginScan}>Scan a QR label</button></div>:null}
 {selected&&state==="idle"?<div className={styles.careWorkspace}>
   <div className={styles.careTopline}><span>PODSCAPE / QUICK CARE</span><span className={styles.recognized}>● BIN RECOGNIZED</span></div>
   <div className={styles.careIdentity}>
    {selected.image?<div className={styles.careThumb}><Image src={selected.image} alt="" fill sizes="84px"/></div>:<div className={styles.careThumbFallback}>❧</div>}
    <div className={styles.careIdentityText}><h1>{selected.species}</h1><p><strong>{selected.name}</strong>{selected.label?" · "+selected.label:""}</p><span>~{selected.quantity} isopods · Active</span></div>
   </div>
   <div className={styles.actionHead}><div><h2>Log care</h2><p>Tap to save. Stay here to log more.</p></div><span>{loggedForBin.length} this session</span></div>
   <div className={styles.careGrid}>{tasks.map(t=>{
    const logged=recent.some(r=>r.binId===selected.id&&r.label===t.label);
    const last=lastDates[selected.id]?.[t.note];
    return <button type="button" key={t.label} className={logged?styles.careTileLogged:styles.careTile} disabled={pending||undoPending} onClick={()=>save(t.kind,t.note,t.label)}>
      <span className={styles.careTileTop}><span aria-hidden="true">{t.icon}</span><span aria-hidden="true">{logged?"✓":""}</span></span>
      <strong>{t.label}</strong><small>{logged?"Saved this session · ":"Last: "}{formatLast(last)}</small>
    </button>;
   })}</div>
   {notice?<div ref={noticeRef} className={styles.inlineNotice} role="status"><span>✓ {notice}</span>{latest?<button type="button" onClick={undo} disabled={undoPending||pending}>{undoPending?"Undoing…":"Undo"}</button>:null}</div>:null}
   <details className={styles.careDetails}><summary>Add note or custom date</summary><label htmlFor="keeper-care-note">Care note</label><textarea id="keeper-care-note" maxLength={1500} rows={3} value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="What did you do or observe?"/><label htmlFor="keeper-care-date">Care date (for notes)</label><input id="keeper-care-date" type="date" value={customDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setCustomDate(e.target.value)}/><button type="button" disabled={pending||!customNote.trim()} onClick={()=>save("observation",customNote.trim(),"Custom note",customDate||undefined)}>Save note</button></details>
   <div className={styles.careFooter}><button type="button" className={styles.nextBin} onClick={beginScan} disabled={pending||undoPending}>▣ Scan next bin →</button><Link href={"/keeper/"+selected.id}>View full colony workspace ↗</Link></div>
   <button className={styles.switchBin} type="button" onClick={()=>setShowManual(v=>!v)}>Choose another bin manually {showManual?"−":"+"}</button>
   {showManual?<div className={styles.manualPicker}><select value={manual} onChange={e=>setManual(e.target.value)} aria-label="Choose another bin"><option value="">Select a bin</option>{bins.map(b=><option key={b.id} value={b.id}>{b.species} — {b.name}</option>)}</select><button onClick={()=>{if(manual){match(manual);setShowManual(false);}}} disabled={!manual}>Open bin</button></div>:null}
  </div>:null}
 {error?<p className={styles.error} role="alert">{error}</p>:null}
 </section>;
}
