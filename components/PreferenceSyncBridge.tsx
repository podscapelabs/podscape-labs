"use client";
import {useEffect,useRef,useState} from "react";
import {PodscapeLineIcon} from "./PodscapeLineIcon";
import {
 defaultUiPreferences,isDefaultUiPreferences,parseUiPreferences,readLocalUiPreferences,
 sameUiPreferences,writeLocalUiPreferences,type UiPreferences
} from "@/lib/ui-preferences";
import styles from "./PreferenceSyncBridge.module.css";

type Mode="checking"|"waiting"|"synced"|"import"|"conflict"|"offline";
type Cloud = {revision:number;preferences:UiPreferences|null;updatedAt:string|null};
function validCloud(value:unknown,isOwner:boolean):Cloud|null {
 if(!value||typeof value!=="object")return null;
 const data=value as Record<string,unknown>;
 if(typeof data.revision!=="number"||!Number.isSafeInteger(data.revision)||data.revision<0)return null;
 if(data.revision===0&&data.preferences===null)return {revision:0,preferences:null,updatedAt:null};
 const preferences=parseUiPreferences(data.preferences,isOwner);
 if(!preferences||data.revision<1)return null;
 return {revision:data.revision,preferences,updatedAt:typeof data.updatedAt==="string"?data.updatedAt:null};
}
type LastSaved = {revision:number;preferences:UiPreferences};
const lastKey=(id:string)=>"podscape-ui-last-synced-v1:"+id;
function lastSaved(id:string,isOwner:boolean):LastSaved|null {
 try {
  const data=JSON.parse(localStorage.getItem(lastKey(id))||"null") as Partial<LastSaved>|null;
  const preferences=parseUiPreferences(data?.preferences,isOwner);
  return typeof data?.revision==="number"&&data.revision>=1&&preferences?{revision:data.revision,preferences}:null;
 }catch{return null}
}
function markSaved(id:string,cloud:Cloud){
 if(!cloud.preferences)return;
 try{localStorage.setItem(lastKey(id),JSON.stringify({revision:cloud.revision,preferences:cloud.preferences}))}catch{}
}
const endpoint="/api/preferences/sync";
async function loadCloud(isOwner:boolean):Promise<Cloud>{
 const response=await fetch(endpoint,{method:"GET",credentials:"same-origin",cache:"no-store"});
 if(!response.ok)throw new Error("Cloud preferences unavailable");
 const data=validCloud(await response.json(),isOwner);
 if(!data)throw new Error("Cloud preferences invalid");
 return data;
}

/** Local-first UI. Conflicting preferences are never resolved by timestamp or silently replaced. */
export function PreferenceSyncBridge({userId,isOwner}:{userId:string|null;isOwner:boolean}){
 const [mode,setMode]=useState<Mode>("checking");
 const [cloud,setCloud]=useState<Cloud>({revision:0,preferences:null,updatedAt:null});
 const [busy,setBusy]=useState(false);
 const modeRef=useRef<Mode>("checking");
 const revisionRef=useRef(0);
 const inFlight=useRef(false);
 const dirty=useRef(false);
 const suppressEvents=useRef(false);
 const booting=useRef(true);
 const ownerRef=useRef(isOwner);
 ownerRef.current=isOwner;
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const saveRef=useRef<()=>Promise<void>>(async()=>{});
 const modeChange=(next:Mode)=>{modeRef.current=next;setMode(next);window.dispatchEvent(new CustomEvent("podscape-preference-sync-state",{detail:next}))};
 const applyRemote=(target:Cloud)=>{
  if(!target.preferences||!userId)return;
  suppressEvents.current=true;
  const success=writeLocalUiPreferences(target.preferences,ownerRef.current,userId);
  suppressEvents.current=false;
  if(!success){modeChange("offline");return}
  markSaved(userId,target);
  revisionRef.current=target.revision;
  setCloud(target);
  modeChange("synced");
 };
 const save=async()=>{
  if(!userId||booting.current||inFlight.current)return;
  if(modeRef.current==="conflict"||modeRef.current==="import"||modeRef.current==="offline")return;
  inFlight.current=true;
  setBusy(true);
  const current=readLocalUiPreferences(ownerRef.current,userId);
  const expected=revisionRef.current;
  try{
   const response=await fetch(endpoint,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({revision:expected,preferences:current})});
   if(response.status===409){
    const latest=await loadCloud(ownerRef.current);
    setCloud(latest);revisionRef.current=latest.revision;
    const previous=lastSaved(userId,ownerRef.current);
    if(latest.preferences&&(sameUiPreferences(latest.preferences,current)||previous&&sameUiPreferences(previous.preferences,current))){
     applyRemote(latest);
    }else modeChange("conflict");
   }else if(!response.ok){modeChange("offline")}
   else{
    const latest=validCloud(await response.json(),ownerRef.current);
    if(!latest||!latest.preferences)throw new Error("Save response invalid");
    setCloud(latest);
    revisionRef.current=latest.revision;
    markSaved(userId,latest);
    modeChange("synced");
    if(!sameUiPreferences(current,readLocalUiPreferences(ownerRef.current,userId)))dirty.current=true;
   }
  }catch{modeChange("offline")}
  finally{
   inFlight.current=false;setBusy(false);
   if(dirty.current&&modeRef.current==="synced"){
    dirty.current=false;
    if(timer.current!==null)clearTimeout(timer.current);
    timer.current=setTimeout(()=>void saveRef.current(),650);
   }
  }
 };
 saveRef.current=save;
 useEffect(()=>{
  if(!userId){booting.current=false;return}
  let active=true;
  booting.current=true;
  modeRef.current="checking";
   let changedDuringLoad=false;
  const touched=()=>{if(booting.current&&!suppressEvents.current)changedDuringLoad=true};
  window.addEventListener("podscape-home-widgets-changed",touched);
  window.addEventListener("podscape-nav-updated",touched);
  window.addEventListener("podscape-workspace-layout-changed",touched);
  loadCloud(isOwner).then(remote=>{
   if(!active)return;
   const local=readLocalUiPreferences(isOwner,userId);
   revisionRef.current=remote.revision;
   setCloud(remote);
   if(!remote.preferences){
    // New account cloud: do not upload generic defaults on first page load.
    modeChange(isDefaultUiPreferences(local)?"waiting":"import");
   }else if(sameUiPreferences(local,remote.preferences)){
    markSaved(userId,remote);
    modeChange("synced");
   }else{
    const previous=lastSaved(userId,isOwner);
    const unchangedHere=previous&&sameUiPreferences(previous.preferences,local);
    if((isDefaultUiPreferences(local)&&!changedDuringLoad)||unchangedHere){
     applyRemote(remote);
    }else modeChange("conflict");
   }
  }).catch(()=>{if(active)modeChange("offline")}).finally(()=>{if(active)booting.current=false});
  return ()=>{
   active=false;
   window.removeEventListener("podscape-home-widgets-changed",touched);
   window.removeEventListener("podscape-nav-updated",touched);
   window.removeEventListener("podscape-workspace-layout-changed",touched);
  };
 },[userId,isOwner]);

 useEffect(()=>{
  if(!userId)return;
  let checking=false;
  let active=true;
  const refresh=async()=>{
   if(!active||checking||booting.current||inFlight.current||modeRef.current!=="synced")return;
   checking=true;
   try{
    const latest=await loadCloud(ownerRef.current);
    if(!active||latest.revision<=revisionRef.current)return;
    const local=readLocalUiPreferences(ownerRef.current,userId);
    const previous=lastSaved(userId,ownerRef.current);
    setCloud(latest);
    revisionRef.current=latest.revision;
    if(latest.preferences&&previous&&sameUiPreferences(previous.preferences,local))applyRemote(latest);
    else modeChange("conflict");
   }catch{
    // Never replace local preferences or interrupt editing for an intermittent network error.
   }finally{checking=false}
  };
  const onVisible=()=>{if(document.visibilityState==="visible")void refresh()};
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",onVisible);
  return ()=>{active=false;window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",onVisible)};
 },[userId]);

 useEffect(()=>{
  if(!userId)return;
  const onChange=()=>{
   if(suppressEvents.current||booting.current)return;
   if(modeRef.current==="waiting"){modeChange("synced")}
   if(modeRef.current!=="synced")return;
   if(inFlight.current){dirty.current=true;return}
   if(timer.current!==null)clearTimeout(timer.current);
   timer.current=setTimeout(()=>void saveRef.current(),650);
  };
  const onStorage=(event:StorageEvent)=>{
   if(event.key===null||event.key.startsWith("podscape-home-widgets-")||event.key.startsWith("podscape-nav-v1-")||event.key==="podscape-manager-layout-v1:"+userId||event.key==="podscape-species-dashboard-v1:"+userId)onChange();
  };
  window.addEventListener("podscape-home-widgets-changed",onChange);
  window.addEventListener("podscape-nav-updated",onChange);
  window.addEventListener("podscape-workspace-layout-changed",onChange);
  window.addEventListener("storage",onStorage);
  return ()=>{
   window.removeEventListener("podscape-home-widgets-changed",onChange);
   window.removeEventListener("podscape-nav-updated",onChange);
   window.removeEventListener("podscape-workspace-layout-changed",onChange);
   window.removeEventListener("storage",onStorage);
   if(timer.current!==null)clearTimeout(timer.current);
  };
 },[userId]);

 async function keepDevice(){
  if(!userId||busy)return;
  // An explicit decision to replace the account copy. Re-read cloud revision
  // before writing to avoid replacing a newer concurrent save unknowingly.
  setBusy(true);
  try{
   const latest=await loadCloud(ownerRef.current);
   if(latest.revision!==cloud.revision){
    revisionRef.current=latest.revision;setCloud(latest);modeChange("conflict");return;
   }
   revisionRef.current=latest.revision;
   modeChange("synced");
  }catch{modeChange("offline")}
  finally{setBusy(false)}
  // Defer to the same optimistic server save path.
  queueMicrotask(()=>void saveRef.current());
 }
 function useAccount(){
  if(cloud.preferences)applyRemote(cloud);
  else modeChange("waiting");
 }
 async function retry(){
  if(!userId)return;
  modeChange("checking");booting.current=true;
  try{
   const latest=await loadCloud(ownerRef.current);
   revisionRef.current=latest.revision;setCloud(latest);
   const local=readLocalUiPreferences(ownerRef.current,userId);
   if(!latest.preferences)modeChange(isDefaultUiPreferences(local)?"waiting":"import");
   else if(sameUiPreferences(latest.preferences,local)){markSaved(userId,latest);modeChange("synced")}
   else modeChange("conflict");
  }catch{modeChange("offline")}
  finally{booting.current=false}
 }
 if(!userId)return null;
 if(mode==="checking"||mode==="waiting"||mode==="synced")return null;
 return <aside className={styles.banner} role="region" aria-label="PodScape preferences synchronization">
  <div className={styles.header}>
   <span className={styles.icon}><PodscapeLineIcon name="grid"/></span>
   <div><strong>{mode==="import"?"Save your PodScape setup?":mode==="conflict"?"Two dashboard layouts found":"Preferences are stored on this device"}</strong>
    <p>{mode==="import"?"Your customized Home, Manager, species dashboards and shortcuts are stored on this device. Save them to your account to use them elsewhere.":mode==="conflict"?"Your device and account have different dashboard or navigation layouts. Choose which to use; neither will be replaced automatically.":"Cloud sync is unavailable. Your existing local setup is safe."}</p>
   </div>
  </div>
  <div className={styles.actions}>
   {mode==="offline"?<button type="button" onClick={()=>void retry()} disabled={busy}>Try again</button>:<>
    <button type="button" className={styles.primary} disabled={busy} onClick={()=>void keepDevice()}>{busy?"Saving…":"Use this device & sync"}</button>
    {mode==="conflict"?<button type="button" disabled={busy} onClick={useAccount}>Use account layout</button>:null}
   </>}
  </div>
 </aside>;
}
