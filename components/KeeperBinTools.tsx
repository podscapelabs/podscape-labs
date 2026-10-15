"use client";
import { useEffect, useState } from "react";
import styles from "./KeeperScanner.module.css";
type Props={binId:string;binName:string;species:string};
export function KeeperBinTools({binId,binName,species}:Props){
 const [interval,setInterval]=useState("3");
 const [message,setMessage]=useState("");
 const [lastMisted,setLastMisted]=useState("");
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("podscape-keeper-reminder-"+binId)||"null");if(saved&&Number.isInteger(saved.intervalDays))setInterval(String(saved.intervalDays));if(typeof saved?.lastMisted==="string")setLastMisted(saved.lastMisted);}catch{}},[binId]);
 const due=lastMisted&&Number(interval)>0?new Date(lastMisted+"T12:00:00"):null;if(due&&!Number.isNaN(due.getTime()))due.setDate(due.getDate()+Number(interval));
 // Resolve the host at interaction time rather than on the server.
 async function openLabel(){
  setMessage("");
  const target=window.location.origin+"/keeper/scan?bin="+encodeURIComponent(binId);
  const popup=window.open("","_blank","width=560,height=700");
  if(!popup){setMessage("Allow pop-ups to print a label.");return;}
  try {
   const QRCode=(await import("qrcode")).default;
   const qr=await QRCode.toDataURL(target,{width:360,margin:2,errorCorrectionLevel:"M",color:{dark:"#173d2b",light:"#fffaf0"}});
   const safe=(value:string)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
   popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title>PodScape Keeper Label</title><style>body{font:15px Arial,sans-serif;margin:24px;background:#f8f4e8;color:#173d2b;text-align:center}.label{border:1px solid #8d9c7e;background:#fffaf0;padding:23px;max-width:350px;margin:auto}.eyebrow{font-size:11px;font-weight:bold;letter-spacing:2px}h1{font:normal 28px Georgia,serif;margin:9px 0}h2{font:normal 21px Georgia,serif;margin:4px 0}img{width:230px;max-width:100%;display:block;margin:14px auto}.helper{font-size:12px;color:#56705b}.print{margin-top:22px;padding:12px 24px;background:#173d2b;color:white;border:0;cursor:pointer}@media print{body{background:white}.print{display:none}}</style></head><body><div class="label"><div class="eyebrow">PODSCAPE LABS / KEEPER</div><h1>'+safe(species)+'</h1><h2>'+safe(binName)+'</h2><img alt="QR label for '+safe(binName)+'" src="'+qr+'"><p>Scan to open Quick Care</p><p class="helper">A PodScape account is required to edit care records.</p></div><button class="print" onclick="window.print()">Print Label</button></body></html>');
   popup.document.close();
  }catch{popup.close();setMessage("QR generation failed. Please retry.");}
 }
 function saveReminder(){
  try{const n=Number(interval);if(!Number.isInteger(n)||n<1||n>365){setMessage("Choose 1–365 days.");return;}
   const key="podscape-keeper-reminder-"+binId;localStorage.setItem(key,JSON.stringify({intervalDays:n,lastMisted,updatedAt:new Date().toISOString()}));setMessage("Saved on this device. Notification delivery is not yet enabled.");
  }catch{setMessage("Unable to save preferences in this browser.");}
 }
 return <section className={styles.panel}><p className={styles.kicker}>YOUR BIN</p><h2>QR Label & Care Settings</h2><p>Print a QR label that opens this exact bin in Quick Care. Anyone scanning must sign in to access its private records.</p><button className={styles.primary} type="button" onClick={openLabel}>Create printable bin QR label</button><p style={{fontSize:".8rem"}}>Your QR image is generated in your browser. Printed links lead to a sign-in protected bin workspace.</p><h3>Misting interval</h3><label>Remind every <input style={{width:70,padding:8,margin:"0 8px"}} type="number" min="1" max="365" value={interval} onChange={e=>setInterval(e.target.value)}/> days</label><label style={{display:"block",marginTop:12}}>Last misted (optional) <input style={{display:"block",padding:10,marginTop:6,maxWidth:"100%"}} type="date" value={lastMisted} max={new Date().toLocaleDateString("en-CA")} onChange={e=>setLastMisted(e.target.value)}/></label>{due&&!Number.isNaN(due.getTime())?<p>Next scheduled misting: <strong>{due.toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"})}</strong></p>:null}<p><button onClick={saveReminder} type="button">Save interval on this device</button></p><p aria-live="polite">{message}</p></section>;
}
