"use client";
/* eslint-disable @next/next/no-img-element -- QR codes are generated as lossless vector SVG data URLs. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import { PodscapeLineIcon } from "./PodscapeLineIcon";
import styles from "./KeeperBulkQrCreator.module.css";

type Bin = { id:string; name:string; label:string; species:string };
const origin = "https://podscapelabs.com";
const presets = [
 { id:"compact", title:"Compact", qr:3, width:3.9, columns:4 },
 { id:"standard", title:"Standard", qr:3.5, width:4.6, columns:3 },
 { id:"large", title:"Large", qr:4, width:5.2, columns:3 }
] as const;
type Preset = (typeof presets)[number]["id"];
function linkForBin(bin:Bin) { return origin + "/keeper/" + encodeURIComponent(bin.id); }
function asSvgDataUri(svg:string) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }

export function KeeperBulkQrCreator({bins}:{bins:Bin[]}) {
 const [selectedIds,setSelectedIds] = useState<string[]>(() => bins.map(bin=>bin.id));
 const [query,setQuery] = useState("");
 const [preset,setPreset] = useState<Preset>("standard");
 const [codes,setCodes] = useState<Record<string,string>>({});
 const [error,setError] = useState("");
 const cache = useRef(new Map<string,string>());
 const chosen = presets.find(item=>item.id===preset)!;
 const selectedSet = useMemo(()=>new Set(selectedIds),[selectedIds]);
 const selectedBins = useMemo(()=>bins.filter(bin=>selectedSet.has(bin.id)),[bins,selectedSet]);
 const visible = useMemo(()=>bins.filter(bin=>[bin.name,bin.species,bin.label].some(value=>value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))),[bins,query]);
 const visibleIds = visible.map(bin=>bin.id);
 const allVisibleSelected = visibleIds.length>0 && visibleIds.every(id=>selectedSet.has(id));
 const ready = selectedBins.length>0 && selectedBins.every(bin=>Boolean(codes[bin.id]));
 useEffect(()=>{
  let cancelled=false;
  const missing=selectedBins.filter(bin=>!cache.current.has(bin.id));
  if(!missing.length) {
   const next:Record<string,string>={};
   for(const bin of selectedBins)next[bin.id]=cache.current.get(bin.id)!;
   Promise.resolve().then(()=>{if(!cancelled)setCodes(next);});
   return ()=>{cancelled=true;};
  }
  Promise.all(missing.map(async bin=>{
   const svg=await QRCode.toString(linkForBin(bin),{
    type:"svg",errorCorrectionLevel:"H",margin:4,width:720,
    color:{dark:"#142c20",light:"#ffffff"}
   });
   return [bin.id,asSvgDataUri(svg)] as const;
  })).then(results=>{
   if(cancelled)return;
   for(const [id,url] of results)cache.current.set(id,url);
   const next:Record<string,string>={};
   for(const bin of selectedBins){const uri=cache.current.get(bin.id);if(uri)next[bin.id]=uri;}
   setCodes(next);
   setError("");
  }).catch(()=>{if(!cancelled)setError("Some QR codes could not be generated. Try selecting fewer bins.");});
  return ()=>{cancelled=true;};
 },[selectedBins]);
 function toggle(id:string){setSelectedIds(prev=>prev.includes(id)?prev.filter(value=>value!==id):[...prev,id]);}
 function toggleAllVisible(){
  setSelectedIds(prev=>{
   const current=new Set(prev);
   if(visibleIds.every(id=>current.has(id)))visibleIds.forEach(id=>current.delete(id));
   else visibleIds.forEach(id=>current.add(id));
   return [...current];
  });
 }
 const style={"--bulk-qr-size":chosen.qr+"cm","--bulk-label-width":chosen.width+"cm","--bulk-columns":chosen.columns} as CSSProperties;
 return <div className={styles.root} style={style}>
  <section className={styles.selector} aria-label="Bulk QR label settings">
   <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / SELECT</p><h2>Choose your bins</h2><span>Each selected bin gets its own unique QR label.</span></div><span className={styles.selectedCount}>{selectedIds.length} / {bins.length} selected</span></div>
   <div className={styles.search}><PodscapeLineIcon name="search"/><input type="search" aria-label="Search bins for labels" placeholder="Search species, bin name or label…" value={query} onChange={event=>setQuery(event.target.value)}/></div>
   <div className={styles.selectionTools}><button type="button" onClick={toggleAllVisible} disabled={visible.length===0}>{allVisibleSelected?"Deselect visible":"Select all visible"}</button><button type="button" onClick={()=>setSelectedIds([])} disabled={!selectedIds.length}>Clear selection</button><small>{visible.length} matching bins</small></div>
   <div className={styles.binList} role="group" aria-label="Bins to include on sheet">
    {visible.map(bin=><label className={selectedSet.has(bin.id)?styles.binSelected:styles.bin} key={bin.id}>
     <input type="checkbox" checked={selectedSet.has(bin.id)} onChange={()=>toggle(bin.id)} />
     <span className={styles.binCopy}><strong>{bin.name}</strong><small>{bin.species}{bin.label?" · "+bin.label:""}</small></span>
     <PodscapeLineIcon name={selectedSet.has(bin.id)?"check":"jar"}/>
    </label>)}
    {!visible.length?<p className={styles.noResults}>No bins match that search.</p>:null}
   </div>
  </section>
  <section className={styles.settings} aria-label="Print label settings">
   <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / FORMAT</p><h2>Sheet layout</h2><span>Clean, readable labels with a QR and the bin identity.</span></div></div>
   <div className={styles.presets} role="group" aria-label="Label size">
    {presets.map(item=><button type="button" key={item.id} className={preset===item.id?styles.activePreset:styles.preset} aria-pressed={preset===item.id} onClick={()=>setPreset(item.id)}>
     <strong>{item.title}</strong><span>{item.qr} × {item.qr} cm QR</span><small>{item.columns} per row</small>
    </button>)}
   </div>
   <p className={styles.note}>Designed for Letter or A4 paper. Choose <strong>Actual size / 100%</strong> in print settings and disable “Fit to page.” A 3 cm or larger QR is recommended for reliable scanning.</p>
  </section>
  <section className={styles.previewSection} aria-label="Printable label sheet preview">
   <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / PREVIEW</p><h2>Your label sheet</h2><span>{selectedBins.length?selectedBins.length+" unique labels, arranged in bin order":"Select at least one bin to preview."}</span></div></div>
   {error?<p role="alert" className={styles.error}>{error}</p>:null}
   {selectedBins.length===0?<div className={styles.emptyPreview}>Choose bins above to create your sheet.</div>:<>
    <div className={styles.previewScroll}><div className={styles.previewGrid}>
     {selectedBins.map(bin=><div key={bin.id} className={styles.previewLabel}>
      {codes[bin.id]?<img src={codes[bin.id]} alt={"QR for "+bin.name}/>:<div className={styles.pending}>Generating…</div>}
      <strong>{bin.name}</strong><span>{bin.species}</span>{bin.label?<small>{bin.label}</small>:null}
     </div>)}
    </div></div>
    <button className={styles.printButton} type="button" disabled={!ready||Boolean(error)} onClick={()=>window.print()}><PodscapeLineIcon name="qr"/> Print {selectedBins.length} {selectedBins.length===1?"label":"labels"} on one sheet</button>
    <p className={styles.note}>Your browser opens the system print dialog. Multiple pages are generated automatically when needed, and you can save as PDF from the print dialog if supported.</p>
   </>}
  </section>
  <div className={styles.printOnly} aria-hidden="true"><div className={styles.printGrid}>
   {selectedBins.map(bin=><div key={bin.id} className={styles.printLabel}>
    {codes[bin.id]?<img src={codes[bin.id]} alt=""/>:null}
    <strong>{bin.name}</strong><span>{bin.species}</span>{bin.label?<small>{bin.label}</small>:null}
   </div>)}
  </div></div>
 </div>;
}
