"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import jsQR from "jsqr";
import { logKeeperEvent } from "@/app/keeper/actions";
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
const tasks=[{label:"Misted",kind:"maintenance",note:"Misted"},{label:"Fed",kind:"feeding",note:"Fed"},{label:"Spot cleaned",kind:"maintenance",note:"Spot cleaned"},{label:"Leaf litter",kind:"maintenance",note:"Leaf litter added"}] as const;
export function KeeperScanner({bins,initialBinId=""}:{bins:Bin[];initialBinId?:string}){
 const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const lock=useRef(false);
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const saving=useRef(false);
 const [selected,setSelected]=useState<Bin|null>(()=>bins.find(b=>b.id===initialBinId)||null);const [state,setState]=useState<"idle"|"scanning"|"saved">("idle");const [error,setError]=useState("");const [choice,setChoice]=useState("");const [pending,start]=useTransition();
 const [sessionCount,setSessionCount]=useState(0);const [customNote,setCustomNote]=useState("");const [customDate,setCustomDate]=useState("");const [manual,setManual]=useState(initialBinId);const [lastSaved,setLastSaved]=useState<{bin:Bin;task:string}|null>(null);
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
 function beginScan(){lock.current=false;setSelected(null);setLastSaved(null);setChoice("");setError("");setState("scanning");}
 function save(kind:string,note:string,label:string,occurredOn?:string){
 if(!selected||pending||saving.current)return;saving.current=true;setError("");setChoice(label);
 start(async()=>{try{const result=await logKeeperEvent({id:selected.id,kind,note,occurredOn});if(result.success){setLastSaved({bin:selected,task:label});setSessionCount(v=>v+1);setState("saved");}else{setError(result.error||"Save failed. Please retry.");}}finally{saving.current=false;}});
 }
 return <section className={styles.wrap}>
 <div className={styles.heading}><div><p className={styles.kicker}>PODSCAPE LABS / KEEPER</p><h1>Quick Care</h1><p>Scan a bin, log care, and move on.</p><p className={styles.sessionCount} aria-live="polite">{sessionCount} {sessionCount===1?"care action":"care actions"} logged this session</p></div><Link href="/ledger/my-collection">My Collection ↗</Link></div>
 {state==="scanning"?<div className={styles.camera}><video ref={video} muted playsInline aria-label="QR scanning camera"/><div className={styles.brackets} aria-hidden="true"/><p>Point your camera at the bin QR code.</p><button onClick={()=>setState("idle")}>Cancel scan</button></div>:null}
 {state==="idle"&&!selected?<div className={styles.panel}><div className={styles.scanIcon}>▣</div><h2>Ready to scan</h2><p>Each QR code opens the exact enclosure it belongs to.</p><button className={styles.primary} onClick={beginScan}>Scan bin QR code</button></div>:null}
 {selected&&state!=="saved"?<div className={styles.panel}><div className={styles.binHero}>{selected.image?<Image src={selected.image} alt="" fill sizes="680px" priority/>:null}<div><p className={styles.kicker}>BIN RECOGNIZED</p><h2>{selected.species}</h2><p><strong>{selected.name}</strong>{selected.label?" · "+selected.label:""}</p><span className={styles.active}>● Active</span></div></div><div className={styles.binFacts}><span><small>Population</small><strong>~{selected.quantity}</strong></span><span><small>Bin</small><strong>{selected.label||"Unlabelled"}</strong></span></div><h3>Quick actions</h3><p className={styles.quickHint}>One tap saves an entry with today’s date and time.</p><div className={styles.grid}>{tasks.map(t=><button key={t.label} disabled={pending} onClick={()=>save(t.kind,t.note,t.label)}>{pending&&choice===t.label?"Saving…":t.label}</button>)}</div><details className={styles.custom}><summary>Add a note or custom date</summary><label htmlFor="keeper-care-note">Care note</label><textarea id="keeper-care-note" maxLength={1500} rows={3} value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="What did you do or observe?"/><label htmlFor="keeper-care-date">Care date (leave blank for now)</label><input id="keeper-care-date" type="date" value={customDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setCustomDate(e.target.value)}/><button type="button" disabled={pending||!customNote.trim()} onClick={()=>save("observation",customNote.trim(),"Custom note",customDate||undefined)}>Save note</button></details><p className={styles.secondary}><Link href={"/keeper/"+selected.id}>Open full colony workspace ↗</Link></p><button onClick={beginScan} disabled={pending}>Scan another bin</button></div>:null}
 {state==="saved"&&lastSaved?<div className={styles.panel} role="status"><div className={styles.success}>✓</div><h2>{lastSaved.task} logged</h2><p>{lastSaved.bin.species} · {lastSaved.bin.name}</p><p>Saved to your private care history just now.</p><button className={styles.primary} onClick={beginScan}>Scan next bin →</button><p className={styles.secondary}><Link href={"/keeper/"+lastSaved.bin.id}>View colony details</Link></p></div>:null}
 {error?<p className={styles.error} role="alert">{error}</p>:null}
 <div className={styles.manual}><h3>No QR label yet?</h3><p>Choose an existing bin to log care without scanning.</p><select value={manual} onChange={e=>setManual(e.target.value)} aria-label="Choose bin"><option value="">Select a bin</option>{bins.map(b=><option key={b.id} value={b.id}>{b.species} — {b.name}</option>)}</select><button onClick={()=>{if(manual)match(manual)}} disabled={!manual}>Open bin</button><p>{bins.length} active bins in your collection</p></div>
 </section>;
}
