"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { logKeeperEvent } from "@/app/keeper/actions";
import styles from "./KeeperScanner.module.css";
type Bin = { id:string; name:string; label:string; species:string; quantity:number };
type DetectedCode = { rawValue:string };
type QRDetector = { detect:(source:HTMLVideoElement)=>Promise<DetectedCode[]> };
type QRConstructor = new (options:{formats:string[]})=>QRDetector;
function readId(value:string):string|null {
 const raw=value.trim();
 if (/^[a-f\d-]{36}$/i.test(raw)) return raw;
 try {const url=new URL(raw);if(url.protocol!=="https:"&&url.protocol!=="http:")return null;const path=url.pathname.match(/\/(?:keeper|bins?)\/([a-f\d-]{36})(?:\/|$)/i);return path?.[1]||null;}catch{return null;}
}
const tasks=[{label:"Misted",kind:"maintenance",note:"Misted"},{label:"Fed",kind:"feeding",note:"Fed"},{label:"Spot cleaned",kind:"maintenance",note:"Spot cleaned"},{label:"Leaf litter",kind:"maintenance",note:"Leaf litter added"}] as const;
export function KeeperScanner({bins}:{bins:Bin[]}){
 const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const lock=useRef(false);
 const [selected,setSelected]=useState<Bin|null>(null);const [state,setState]=useState<"idle"|"scanning"|"saved">("idle");const [error,setError]=useState("");const [choice,setChoice]=useState("");const [pending,start]=useTransition();
 const [manual,setManual]=useState("");const [lastSaved,setLastSaved]=useState<{bin:Bin;task:string}|null>(null);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 function match(value:string){const id=readId(value);const found=bins.find(b=>b.id.toLowerCase()===id?.toLowerCase());if(found){lock.current=true;stop();setSelected(found);setState("idle");setError("");return true;}setError("That code does not match an active bin in your collection.");return false;}
 useEffect(()=>()=>stop(),[]);
 useEffect(()=>{if(state!=="scanning")return;let live=true;let timer:ReturnType<typeof setInterval>|undefined;
 async function begin(){try{
 const ctor=(window as unknown as {BarcodeDetector?:QRConstructor}).BarcodeDetector;
 if(!ctor){setError("This browser does not support camera QR detection. Use your phone camera to open a bin link, or select a bin below.");setState("idle");return;}
 const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
 if(!live){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
 if(!video.current){stop();return;}video.current.srcObject=media;await video.current.play();
 const detector=new ctor({formats:["qr_code"]});let busy=false;
 timer=setInterval(async()=>{if(busy||lock.current||!video.current||video.current.readyState<2)return;busy=true;try{const codes=await detector.detect(video.current);if(live&&codes.length)match(codes[0].rawValue);}catch{}finally{busy=false;}},300);
 }catch{setError("Camera unavailable. Check permissions or choose a bin manually.");setState("idle");}}
 begin();return()=>{live=false;if(timer)clearInterval(timer);stop();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[state]);
 function beginScan(){lock.current=false;setSelected(null);setLastSaved(null);setChoice("");setError("");setState("scanning");}
 function save(kind:string,note:string,label:string){
 if(!selected||pending)return;setError("");setChoice(label);
 start(async()=>{const result=await logKeeperEvent({id:selected.id,kind,note});if(result.success){setLastSaved({bin:selected,task:label});setState("saved");}else{setError(result.error||"Save failed. Please retry.");}});
 }
 return <section className={styles.wrap}>
 <div className={styles.heading}><div><p className={styles.kicker}>PODSCAPE LABS / KEEPER</p><h1>Quick Care</h1><p>Scan a bin, log care, and move on.</p></div><Link href="/ledger/my-collection">My Collection ↗</Link></div>
 {state==="scanning"?<div className={styles.camera}><video ref={video} muted playsInline aria-label="QR scanning camera"/><div className={styles.brackets} aria-hidden="true"/><p>Point your camera at the bin QR code.</p><button onClick={()=>setState("idle")}>Cancel scan</button></div>:null}
 {state==="idle"&&!selected?<div className={styles.panel}><div className={styles.scanIcon}>▣</div><h2>Ready to scan</h2><p>Each QR code opens the exact enclosure it belongs to.</p><button className={styles.primary} onClick={beginScan}>Scan bin QR code</button></div>:null}
 {selected&&state!=="saved"?<div className={styles.panel}><p className={styles.kicker}>BIN RECOGNIZED</p><h2>{selected.species}</h2><p><strong>{selected.name}</strong>{selected.label?" · "+selected.label:""}</p><p>Estimated count: {selected.quantity}</p><h3>Quick actions</h3><div className={styles.grid}>{tasks.map(t=><button key={t.label} disabled={pending} onClick={()=>save(t.kind,t.note,t.label)}>{pending&&choice===t.label?"Saving…":t.label}</button>)}</div><p className={styles.secondary}><Link href={"/keeper/"+selected.id}>Open full workspace ↗</Link></p><button onClick={beginScan} disabled={pending}>Scan another bin</button></div>:null}
 {state==="saved"&&lastSaved?<div className={styles.panel} role="status"><div className={styles.success}>✓</div><h2>{lastSaved.task} logged</h2><p>{lastSaved.bin.species} · {lastSaved.bin.name}</p><p>Saved to your private care history.</p><button className={styles.primary} onClick={beginScan}>Scan next bin →</button><p className={styles.secondary}><Link href={"/keeper/"+lastSaved.bin.id}>View colony details</Link></p></div>:null}
 {error?<p className={styles.error} role="alert">{error}</p>:null}
 <div className={styles.manual}><h3>No QR label yet?</h3><p>Choose an existing bin, or paste its direct Keeper link.</p><select value={manual} onChange={e=>setManual(e.target.value)} aria-label="Choose bin"><option value="">Select a bin</option>{bins.map(b=><option key={b.id} value={b.id}>{b.species} — {b.name}</option>)}</select><button onClick={()=>{if(manual)match(manual)}} disabled={!manual}>Open bin</button><p>{bins.length} active bins in your collection</p></div>
 </section>;
}
