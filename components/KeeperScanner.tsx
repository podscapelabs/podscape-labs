"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {useUnsavedBinChanges} from "./useUnsavedBinChanges";
import {binDisplayName} from "@/lib/bin-identity";
import jsQR from "jsqr";
import { logKeeperEvent, undoKeeperEvent, logKeeperEventBatch, undoKeeperEventBatch } from "@/app/keeper/actions";
import styles from "./KeeperScanner.module.css";
import {WorkspaceSectionHeader} from "./PodscapeWorkspaceUI";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {BinSwitcher} from "./BinSwitcher";
type Bin = { id:string; name:string; label:string; speciesId:string; species:string; quantity:number; status:string; breeding:string; image:string|null };
type DetectedCode = { rawValue:string };
type QRDetector = { detect:(source:HTMLVideoElement)=>Promise<DetectedCode[]> };
type QRConstructor = new (options:{formats:string[]})=>QRDetector;
type CameraCapabilities={focusMode?:string[];torch?:boolean;zoom?:{min:number;max:number;step?:number}};
type EnhancedTrack=MediaStreamTrack&{getCapabilities:()=>MediaTrackCapabilities&CameraCapabilities};
type EnhancedConstraints=MediaTrackConstraints&{focusMode?:string;torch?:boolean;zoom?:number};
function readId(value:string):string|null {
 const raw=value.trim();
 if (/^[a-f\d-]{36}$/i.test(raw)) return raw;
 try {const url=new URL(raw);if(url.protocol!=="https:"&&url.protocol!=="http:")return null;const path=url.pathname.match(/\/(?:keeper|bins?)\/([a-f\d-]{36})(?:\/|$)/i);return path?.[1]||url.searchParams.get("bin")||null;}catch{return null;}
}
const tasks=[{label:"Misted",kind:"maintenance",note:"Misted",icon:"droplet"},{label:"Fed",kind:"feeding",note:"Fed",icon:"jar"},{label:"Spot cleaned",kind:"maintenance",note:"Spot cleaned",icon:"bin"},{label:"Leaf litter",kind:"maintenance",note:"Leaf litter added",icon:"leaf"}] as const;
type CareRecord={id:string;binId:string;label:string;note:string;createdAt:string;previous:string|null;reminderBefore?:string|null};
type LastOperation={records:CareRecord[];label:string};
type ActivityEntry={id:string;kind:string;note:string;createdAt:string;quantityChange:number|null};
/** Keep the optional on-device misting schedule aligned with a successful misting log. */
function syncMistingReminder(binId:string,createdAt:string):string|null|undefined{
 try{
  const key="podscape-keeper-reminder-"+binId;
  const previous=localStorage.getItem(key);
  if(!previous)return undefined; // Never create a schedule the keeper did not choose.
  const reminder=JSON.parse(previous);
  if(!Number.isInteger(reminder?.intervalDays))return undefined;
  const date=new Date(createdAt);
  const localDay=[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
  localStorage.setItem(key,JSON.stringify({...reminder,lastMisted:localDay,updatedAt:new Date().toISOString()}));
  return previous;
 }catch{return undefined;}
}
function restoreMistingReminder(entry:CareRecord){
 if(entry.reminderBefore===undefined)return;
 try{const key="podscape-keeper-reminder-"+entry.binId;
  if(entry.reminderBefore===null)localStorage.removeItem(key);
  else localStorage.setItem(key,entry.reminderBefore);
 }catch{/* Device-only reminder preferences may be unavailable. */}
}
function formatLast(value:string|null|undefined){
 if(!value)return "Never logged";
 const date=new Date(value);if(Number.isNaN(date.getTime()))return "Never logged";
 const now=new Date();if(date.toDateString()===now.toDateString())return "Today · "+date.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
 return date.toLocaleDateString(undefined,{month:"short",day:"numeric",...(date.getFullYear()===now.getFullYear()?{}:{year:"numeric" as const})});
}
export function KeeperScanner({bins,initialBinId="",startManual=false,careMode=false,careDates={},activity={}}:{bins:Bin[];initialBinId?:string;startManual?:boolean;careMode?:boolean;careDates?:Record<string,Record<string,string>>;activity?:Record<string,ActivityEntry[]>}){
 const router=useRouter();
 const video=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);const lock=useRef(false);
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const saving=useRef(false);
 const [torchAvailable,setTorchAvailable]=useState(false);const [torchOn,setTorchOn]=useState(false);
 const [zoomRange,setZoomRange]=useState<{min:number;max:number}|null>(null);const [zoom,setZoom]=useState(1);
 const [selected,setSelected]=useState<Bin|null>(()=>bins.find(b=>b.id===initialBinId)||null);const [state,setState]=useState<"idle"|"scanning">(initialBinId||startManual?"idle":"scanning");const [error,setError]=useState("");const [pending,start]=useTransition();
 const [binSearch,setBinSearch]=useState("");
 const [showAllBins,setShowAllBins]=useState(false);
 const [showBinPicker,setShowBinPicker]=useState(false);
 const [showHistory,setShowHistory]=useState(false);
 const [customNote,setCustomNote]=useState("");const [customDate,setCustomDate]=useState("");
 useUnsavedBinChanges(Boolean(customNote.trim()));
 const [recent,setRecent]=useState<CareRecord[]>([]);
 const [undoneIds,setUndoneIds]=useState<string[]>([]);
 const [lastDates,setLastDates]=useState<Record<string,Record<string,string>>>(careDates);
 const [notice,setNotice]=useState("");
 const [undoPending,setUndoPending]=useState(false);
 const [multiCare,setMultiCare]=useState(false);
 const [chosenBins,setChosenBins]=useState<string[]>([]);
 const [confirmAllCare,setConfirmAllCare]=useState<{kind:string;note:string;label:string}|null>(null);
 const [lastOperation,setLastOperation]=useState<LastOperation|null>(null);
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;canvas.current=null;setTorchOn(false);};
 function match(value:string){const id=readId(value);const found=bins.find(b=>b.id.toLowerCase()===id?.toLowerCase());if(found){lock.current=true;stop();if(state==="scanning"&&!careMode){router.push("/keeper/"+found.id);return true;}setSelected(found);setShowBinPicker(false);setShowHistory(false);setShowAllBins(false);setState("idle");setCustomNote("");setCustomDate("");setError("");setNotice(lastOperation?"Previous care action available to undo.":"");setMultiCare(false);setChosenBins([found.id]);setConfirmAllCare(null);return true;}setError("That code does not match an active bin in your collection.");return false;}
 useEffect(()=>()=>stop(),[]);
 useEffect(()=>{if(state!=="scanning")return;
 let live=true;let timer:ReturnType<typeof setInterval>|undefined;
 async function begin(){
  try{
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}},audio:false});
   if(!live){media.getTracks().forEach(t=>t.stop());return;}
   stream.current=media;
   const track=media.getVideoTracks()[0] as EnhancedTrack;
   try{
    const caps=track.getCapabilities?.() as CameraCapabilities|undefined;
    setTorchAvailable(Boolean(caps?.torch));
    if(caps?.zoom&&caps.zoom.max>caps.zoom.min&&Math.min(caps.zoom.max,4)>caps.zoom.min){setZoomRange({min:caps.zoom.min,max:Math.min(caps.zoom.max,4)});setZoom((track.getSettings() as MediaTrackSettings&{zoom?:number}).zoom||caps.zoom.min);}
    else setZoomRange(null);
    if(caps?.focusMode?.includes("continuous"))await track.applyConstraints({advanced:[{focusMode:"continuous"} as EnhancedConstraints]});
   }catch{/* Optional hardware controls differ between iPhone models. */}
   if(!video.current){stop();return;}
   video.current.srcObject=media;await video.current.play();
   const ctor=(window as unknown as {BarcodeDetector?:QRConstructor}).BarcodeDetector;
   const detector=ctor?new ctor({formats:["qr_code"]}):null;
   if(!detector)canvas.current=document.createElement("canvas");
   let busy=false;let attempts=0;
   timer=setInterval(async()=>{
    if(busy||lock.current||!video.current||video.current.readyState<2)return;
    busy=true;
    try{
     let value:string|undefined;
     if(detector){const codes=await detector.detect(video.current);value=codes[0]?.rawValue;}
     if(!value){
      const source=video.current;const frame=canvas.current||(canvas.current=document.createElement("canvas"));
      if(source.videoWidth&&source.videoHeight){
       const context=frame.getContext("2d",{willReadFrequently:true});
       if(context){
        // Decode center at high resolution first. Tiny printed labels lost detail in the former 720px full-frame downscale.
        // Periodically decode the whole image so off-center codes are still detected.
        const full=attempts++%3===2;
        const crop=full?1:0.7;
        const sx=Math.round(source.videoWidth*(1-crop)/2),sy=Math.round(source.videoHeight*(1-crop)/2);
        const sw=Math.round(source.videoWidth*crop),sh=Math.round(source.videoHeight*crop);
        const scale=Math.min(1,full?1280/sw:1152/sw);
        frame.width=Math.max(1,Math.round(sw*scale));frame.height=Math.max(1,Math.round(sh*scale));
        context.drawImage(source,sx,sy,sw,sh,0,0,frame.width,frame.height);
        const pixels=context.getImageData(0,0,frame.width,frame.height);
        value=jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:"dontInvert"})?.data;
        if(!value&&full)value=jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:"onlyInvert"})?.data;
       }
      }
     }
     if(live&&value)match(value);
    }catch{/* Transient camera-frame failures should not interrupt scanning. */}
    finally{busy=false;}
   },240);
  }catch{if(live){setError("Camera unavailable. Check permissions or choose a bin manually.");setState("idle");}}
 }
 begin();
 return()=>{live=false;if(timer)clearInterval(timer);stop();};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[state]);
 async function setCameraOption(option:EnhancedConstraints){
  const track=stream.current?.getVideoTracks()[0];if(!track)return false;
  try{await track.applyConstraints({advanced:[option]});return true;}catch{return false;}
 }
 async function toggleTorch(){if(await setCameraOption({torch:!torchOn}))setTorchOn(v=>!v);}
 async function updateZoom(value:number){if(await setCameraOption({zoom:value}))setZoom(value);}
 function beginScan(){lock.current=false;setSelected(null);setNotice(lastOperation?"Previous care action available to undo.":"");setError("");setMultiCare(false);setChosenBins([]);setConfirmAllCare(null);setState("scanning");}
 function save(kind:string,note:string,label:string,occurredOn?:string){
 if(!selected||pending||saving.current)return;
 // A checked tile is a successful save in this session, not a toggle to delete.
 if(tasks.some(t=>t.label===label)&&recent.some(r=>r.binId===selected.id&&r.label===label)){setNotice(label+" already logged this session. Use Undo to correct it.");return;}
 saving.current=true;setError("");
 const bin=selected;
 start(async()=>{try{
  const result=await logKeeperEvent({id:bin.id,kind,note,occurredOn});
  if(result.success&&result.id){
   const previous=lastDates[bin.id]?.[note]||null;
   const createdAt=occurredOn?occurredOn+"T12:00:00Z":new Date().toISOString();
   const entry:CareRecord={id:result.id,binId:bin.id,label,note,createdAt,previous,reminderBefore:note==="Misted"?syncMistingReminder(bin.id,createdAt):undefined};
   setRecent(r=>[...r,entry]);setLastOperation({records:[entry],label});
   setLastDates(d=>({...d,[bin.id]:{...(d[bin.id]||{}),[note]:createdAt}}));
   setNotice(label+" saved");
   if(kind==="observation")setCustomNote("");
  }else setError(result.error||"Save failed. Please retry.");
 }catch{setError("Unable to save care. Please retry.");}finally{saving.current=false;}});
 }
 function switchBin(bin:Bin){
  if(pending||undoPending)return;
  if(customNote.trim()&&!window.confirm("Leave this bin without saving your care note?"))return;
  setShowBinPicker(false);setShowHistory(false);
  setSelected(bin);setNotice(lastOperation?"Previous care action available to undo.":"");setError("");setCustomNote("");setCustomDate("");setChosenBins([bin.id]);setConfirmAllCare(null);
 }
 function toggleMultiCare(){
  if(pending||undoPending)return;
  setMultiCare(v=>!v);setShowBinPicker(false);setChosenBins(selected?[selected.id]:[]);setConfirmAllCare(null);setNotice(lastOperation?"Previous care action available to undo.":"");setError("");
 }
 function toggleChosen(id:string){setConfirmAllCare(null);setChosenBins(ids=>ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]);}
 function selectSpecies(){
  if(!selected)return;
  setConfirmAllCare(null);setChosenBins(bins.filter(b=>b.speciesId===selected.speciesId).map(b=>b.id));
 }
 function selectAllEnclosures(){setConfirmAllCare(null);setChosenBins(bins.map(b=>b.id));}
 function saveMultiple(kind:string,note:string,label:string,confirmed=false){
  if(!multiCare||pending||undoPending||saving.current)return;
  if(!chosenBins.length){setError("Select at least one enclosure.");return;}
  // Only skip duplicates recorded in this open session; a partial selection can still proceed.
  const targetIds=chosenBins.filter(id=>!recent.some(r=>r.binId===id&&r.label===label));
  if(!targetIds.length){setNotice(label+" already logged for all selected bins this session.");return;}
  if(targetIds.length>500){setError("Care batches support up to 500 bins.");return;}
  if(chosenBins.length===bins.length&&bins.length>1&&!confirmed){setConfirmAllCare({kind,note,label});return;}
  setConfirmAllCare(null);
  saving.current=true;setError("");setNotice("");
  start(async()=>{try{
   const result=await logKeeperEventBatch({ids:targetIds,kind,note});
   if(!result.success||!result.events){setError(result.error||"Could not save care for these bins.");return;}
   const createdAt=new Date().toISOString();
   const entries:CareRecord[]=result.events.map(event=>({id:event.id,binId:event.enclosureId,label,note,createdAt,previous:lastDates[event.enclosureId]?.[note]||null,reminderBefore:note==="Misted"?syncMistingReminder(event.enclosureId,createdAt):undefined}));
   setRecent(r=>[...r,...entries]);
   setLastOperation({records:entries,label});
   setLastDates(d=>{const updated={...d};for(const entry of entries)updated[entry.binId]={...(updated[entry.binId]||{}),[note]:createdAt};return updated;});
   setNotice(label+" logged for "+entries.length+" "+(entries.length===1?"bin":"bins"));
  }catch{setError("Unable to save bulk care. Check your history before retrying.");}finally{saving.current=false;}});
 }
 async function undo(){
  const operation=lastOperation;if(!operation||undoPending||pending)return;
  setUndoPending(true);setError("");
  try{
   const result=operation.records.length>1
    ?await undoKeeperEventBatch({eventIds:operation.records.map(r=>r.id)})
    :await undoKeeperEvent({id:operation.records[0].id,enclosureId:operation.records[0].binId});
   if(!result.success){setError(result.error||"Undo failed. Your care entry remains saved.");setNotice("");return;}
   for(const entry of operation.records)restoreMistingReminder(entry);
   const ids=new Set(operation.records.map(r=>r.id));
   setRecent(r=>r.filter(x=>!ids.has(x.id)));
   setUndoneIds(previous=>[...previous,...ids]);
   setLastDates(d=>{const updated={...d};for(const entry of operation.records)updated[entry.binId]={...(updated[entry.binId]||{}),[entry.note]:entry.previous||""};return updated;});
   setNotice(operation.label+" undone for "+operation.records.length+" "+(operation.records.length===1?"bin":"bins"));
   setLastOperation(null);
  }catch{setError("Undo failed. Please retry; your entry remains saved.");setNotice("");}finally{setUndoPending(false);}
 }
 const filteredBins=bins.filter(bin=>[bin.species,bin.name,bin.label].some(value=>value.toLocaleLowerCase().includes(binSearch.trim().toLocaleLowerCase())))
  .sort((a,b)=>a.species.localeCompare(b.species)||a.name.localeCompare(b.name));
 const visibleChoices=showAllBins||binSearch.trim()?filteredBins:filteredBins.slice(0,8);
 const latest=lastOperation;
 const loggedForBin=selected?recent.filter(r=>r.binId===selected.id):[];
 const speciesBins=selected?bins.filter(b=>b.speciesId===selected.speciesId):[];
 const speciesPopulation=speciesBins.reduce((sum,bin)=>sum+bin.quantity,0);
 const historyForBin=selected?[
  ...recent.filter(r=>r.binId===selected.id).map(r=>({id:r.id,kind:r.label==="Fed"?"feeding":r.label==="Custom note"?"observation":"maintenance",note:r.note,createdAt:r.createdAt,quantityChange:null as number|null})),
  ...(activity[selected.id]||[]).filter(event=>!undoneIds.includes(event.id))
 ].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,3):[];
 return <section className={styles.wrap}>
 {state!=="scanning"&&!selected?<div className={styles.heading}><div><p className={styles.kicker}>PODSCAPE LABS / KEEPER</p><h1>Quick Care</h1><p>Scan a bin, log care, and move on.</p></div><Link href="/keeper/collection">My Colonies ↗</Link></div>:null}
 {state==="scanning"?<div className={styles.camera}><video ref={video} muted playsInline aria-label="QR scanning camera"/><div className={styles.brackets} aria-hidden="true"><span/><span/><span/><span/></div>{torchAvailable||zoomRange?<div className={styles.cameraControls}>{torchAvailable?<button type="button" onClick={toggleTorch} aria-pressed={torchOn}>{torchOn?"Light on":"Light off"}</button>:null}{zoomRange?<button type="button" onClick={()=>updateZoom(zoom>zoomRange.min+.1?zoomRange.min:Math.min(2,zoomRange.max))}>{zoom>zoomRange.min+.1?"1×":"2×"}</button>:null}</div>:null}</div>:null}
 {state==="scanning"?<div className={styles.scanBelow}><p>Hold your label steady inside the corners. Move back slightly if blurry.</p><button type="button" onClick={()=>setState("idle")}>Choose a bin manually →</button></div>:null}
 {state==="idle"&&!selected?<section className={styles.quickChoose} aria-label="Choose a bin to log care">
   <div className={styles.quickChooseHeader}><div><p className={styles.kicker}>YOUR ENCLOSURES</p><h2>Choose a bin</h2><p>Tap a colony to start logging care.</p></div><span>{bins.length} {bins.length===1?"bin":"bins"}</span></div>
   {bins.length?<><div className={styles.quickChooseSearch}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Find a bin to log care" placeholder="Search species or bin name…" value={binSearch} onChange={event=>{setBinSearch(event.target.value);setShowAllBins(false)}} autoComplete="off"/>{binSearch?<button type="button" aria-label="Clear bin search" onClick={()=>setBinSearch("")}>×</button>:null}</div>
    <div className={styles.quickChooseList}>{filteredBins.length?visibleChoices.map(bin=><button key={bin.id} type="button" className={styles.quickChooseBin} onClick={()=>match(bin.id)}><span className={styles.quickChoosePhoto}>{bin.image?<Image src={bin.image} alt="" fill sizes="46px"/>:<span aria-hidden="true"><PodscapeLineIcon name="bin"/></span>}</span><span className={styles.quickChooseIdentity}><strong>{bin.species}</strong><small>{binDisplayName({id:bin.id,name:bin.name})}{bin.label?" · "+bin.label:""}</small></span><span aria-hidden="true" className={styles.quickChooseArrow}>→</span></button>):<p className={styles.quickChooseEmpty}>No matching bins. Try another species or enclosure name.</p>}</div>{!binSearch.trim()&&!showAllBins&&filteredBins.length>8?<button type="button" className={styles.showMoreBins} onClick={()=>setShowAllBins(true)}>Show all {filteredBins.length} bins ↓</button>:null}{showAllBins&&filteredBins.length>8&&!binSearch.trim()?<button type="button" className={styles.showMoreBins} onClick={()=>setShowAllBins(false)}>Show fewer bins ↑</button>:null}</>
    :<div className={styles.quickChooseEmpty}>You do not have any active bins yet. <Link href="/keeper/new">Add your first bin →</Link></div>}
   <div className={styles.quickChooseFooter}><button type="button" onClick={beginScan}>▣ Scan a QR label instead</button><Link href="/keeper/new">+ Add bin</Link></div>
  </section>:null}
 {selected&&state==="idle"?<div className={styles.careWorkspace}>
   <div className={styles.careTopline}><span>MANAGER / QUICK CARE</span><Link href={"/keeper/"+selected.id}>← Back to bin</Link></div>
   <div className={styles.careIdentity}>
    {selected.image?<div className={styles.careThumb}><Image src={selected.image} alt="" fill sizes="84px"/></div>:<div className={styles.careThumbFallback}><PodscapeLineIcon name="bin"/></div>}
    <div className={styles.careIdentityText}><h1>{selected.species}</h1><p><strong>{binDisplayName({id:selected.id,name:selected.name})}</strong>{selected.label?" · "+selected.label:""}</p><span>{selected.status.replaceAll("-"," ")} · Breeding: {selected.breeding.replaceAll("-"," ")}</span></div>
   </div>
   <BinSwitcher bins={bins} currentId={selected.id} disabled={pending||undoPending||multiCare} onSelect={id=>{
    const bin=bins.find(item=>item.id===id);
    if(!bin)return;
    switchBin(bin);
   }}/>
   <div className={styles.populationStrip} aria-label="Estimated population counts"><div><small>This bin</small><strong>~{selected.quantity.toLocaleString()}</strong></div><div><small>{selected.species} · {speciesBins.length} {speciesBins.length===1?"bin":"bins"}</small><strong>~{speciesPopulation.toLocaleString()} total</strong></div></div>
   <div className={styles.binPicker}>
    <WorkspaceSectionHeader title={multiCare?"Group care selection":"Your enclosure"} meta={multiCare?bins.length:speciesBins.length}
      description={multiCare?"Choose which bins will receive this care entry.":"Quick Care is focused on the selected bin."}
      action={<button type="button" className={styles.modeButton} aria-pressed={multiCare} onClick={toggleMultiCare} disabled={pending||undoPending}>{multiCare?"Done selecting":"Multi-care"}</button>}/>
    {!multiCare?<div className={styles.compactBinSwitch}>
      <div><strong>{binDisplayName({id:selected.id,name:selected.name})}</strong><small>{selected.species}{speciesBins.length>1?" · "+speciesBins.length+" bins in this species":""}</small></div>
      <button type="button" disabled={pending||undoPending||speciesBins.length<=1} aria-expanded={showBinPicker} onClick={()=>setShowBinPicker(x=>!x)}>{showBinPicker?"Hide bins":"Switch bin"}</button>
      <button type="button" disabled={pending||undoPending} onClick={()=>{setSelected(null);setState("idle");setShowBinPicker(false);setBinSearch("");setMultiCare(false);}}>Other species</button>
     </div>:null}
    {multiCare?<div className={styles.selectionLine}>
      <span>{chosenBins.length} of {bins.length} selected</span>
      <div className={styles.selectionActions}><button type="button" onClick={selectSpecies} disabled={pending||undoPending}>All {selected.species} ({speciesBins.length})</button><button type="button" onClick={selectAllEnclosures} disabled={pending||undoPending}>All bins ({bins.length})</button></div>
    </div>:null}
    {(multiCare||showBinPicker)?<div className={styles.binCarousel} role="group" aria-label={multiCare?"Choose bins for bulk care":"Other enclosures of this species"}>
      {(multiCare?bins:speciesBins).map(bin=>{const marked=multiCare?chosenBins.includes(bin.id):bin.id===selected.id;return <button type="button" key={bin.id} className={marked?styles.binCardSelected:styles.binCard} onClick={()=>multiCare?toggleChosen(bin.id):switchBin(bin)} aria-pressed={marked} disabled={pending||undoPending}><span className={styles.binCardHeading}>{multiCare?bin.species:binDisplayName({id:bin.id,name:bin.name})}<span aria-hidden="true">{marked?"✓":""}</span></span><strong>{multiCare?binDisplayName({id:bin.id,name:bin.name}):bin.label||"No shelf assigned"}</strong></button>;})}
     </div>:null}
    {multiCare?<p className={styles.bulkHint}>Bulk care writes a separate private log to each selected bin. Undo reverses the batch.</p>:null}
   </div>
   <div className={styles.actionHead}><WorkspaceSectionHeader title={multiCare?"Group care":"Quick care"} description={multiCare?"Log care across your selected bins.":"Tap an action to log it."} action={<span className={styles.careSessionCount}>{multiCare?chosenBins.length+" selected":loggedForBin.length+" this session"}</span>}/></div>
   {error?<p className={styles.error} role="alert">{error}</p>:null}
   <div className={styles.careGrid}>{tasks.map(t=>{
    const logged=multiCare?chosenBins.length>0&&chosenBins.every(id=>recent.some(r=>r.binId===id&&r.label===t.label)):recent.some(r=>r.binId===selected.id&&r.label===t.label);
    const last=lastDates[selected.id]?.[t.note];
    return <button type="button" key={t.label} className={logged?styles.careTileLogged:styles.careTile} disabled={pending||undoPending||(multiCare&&chosenBins.length===0)} onClick={()=>multiCare?saveMultiple(t.kind,t.note,t.label):save(t.kind,t.note,t.label)}>
      <span className={styles.careTileTop}><span aria-hidden="true"><PodscapeLineIcon name={t.icon}/></span><span aria-hidden="true">{logged?"✓":""}</span></span>
      <strong>{t.label}</strong><small>{multiCare?(logged?"Saved for selected bins":chosenBins.filter(id=>recent.some(r=>r.binId===id&&r.label===t.label)).length+" of "+chosenBins.length+" logged"):(logged?"Saved this session · ":"Last: ")+formatLast(last)}</small>
    </button>;
   })}</div>
   {confirmAllCare&&multiCare?<div className={styles.confirmAll} role="group" aria-label="Confirm all-enclosure care"><p>Log <strong>{confirmAllCare.label.toLowerCase()}</strong> for <strong>{chosenBins.filter(id=>!recent.some(r=>r.binId===id&&r.label===confirmAllCare.label)).length} remaining bins</strong> across your collection?</p><div><button type="button" onClick={()=>setConfirmAllCare(null)} disabled={pending}>Cancel</button><button type="button" onClick={()=>saveMultiple(confirmAllCare.kind,confirmAllCare.note,confirmAllCare.label,true)} disabled={pending}>Confirm bulk care</button></div></div>:null}
   {(notice||latest)?<div className={styles.inlineNotice} role="status"><span>{notice||"Care saved."}</span>{latest?<button type="button" onClick={undo} disabled={undoPending||pending}>{undoPending?"Undoing…":"Undo "+latest.label+(latest.records.length>1?" ("+latest.records.length+")":"")}</button>:null}</div>:null}
   {!multiCare?<details className={styles.careDetails}><summary>Add note or custom date</summary><label htmlFor="keeper-care-note">Care note</label><textarea id="keeper-care-note" maxLength={1500} rows={3} value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="What did you do or observe?"/><label htmlFor="keeper-care-date">Care date (for notes)</label><input id="keeper-care-date" type="date" value={customDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setCustomDate(e.target.value)}/><button type="button" disabled={pending||!customNote.trim()} onClick={()=>save("observation",customNote.trim(),"Custom note",customDate||undefined)}>Save note</button></details>:null}
   <div className={styles.workspaceHistory}>
    <div className={styles.compactHistoryHead}><strong>Recent care</strong><button type="button" aria-expanded={showHistory} onClick={()=>setShowHistory(v=>!v)}>{showHistory?"Hide records":"Show records"}</button><Link className={styles.historyFullLink} href={"/keeper/"+selected.id+"/history"}>Full history →</Link></div>
    {showHistory?(historyForBin.length?<div className={styles.historyList}>{historyForBin.map(event=><div key={event.id} className={styles.historyEntry}><div><strong>{event.note||event.kind.replaceAll("-"," ")}</strong><small>{event.kind.replaceAll("-"," ")}</small></div><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</time></div>)}</div>:<p className={styles.historyEmpty}>No recorded care yet. Your next log will appear here.</p>):<p className={styles.historyEmpty}>{historyForBin.length?historyForBin.length+" recent "+(historyForBin.length===1?"entry":"entries"):"Your next care entry will appear here."}</p>}
   </div>
   <div className={styles.careFooter}><Link className={styles.settingsLink} href={"/keeper/"+selected.id+"/details"}>Bin settings & QR ↗</Link><button type="button" className={styles.nextBin} onClick={beginScan} disabled={pending||undoPending}>▣ Scan next bin</button></div>


  </div>:null}
 {(!selected||state!=="idle")&&error?<p className={styles.error} role="alert">{error}</p>:null}
 </section>;
}
