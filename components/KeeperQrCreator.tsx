"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import styles from "./KeeperQrCreator.module.css";

type Bin = {id:string;name:string;label:string;species:string};
const sizes = [2,3,4];
const origin = "https://podscapelabs.com";
export function KeeperQrCreator({bins,initialBinId}:{bins:Bin[];initialBinId:string}) {
 const [binId,setBinId] = useState(bins.some(b=>b.id===initialBinId)?initialBinId:bins[0]?.id||"");
 const [size,setSize] = useState(3);
 const [custom,setCustom] = useState("");
 const [svg,setSvg] = useState("");
 const [error,setError] = useState("");
 const selected = bins.find(bin=>bin.id===binId);
 const dimension = custom!==""?Number(custom):size;
 const valid = Number.isFinite(dimension)&&dimension>=2&&dimension<=10;
 const url = selected ? origin+"/keeper/"+encodeURIComponent(selected.id) : "";
 useEffect(()=>{if(!url){setSvg("");return;}let cancelled=false;QRCode.toString(url,{type:"svg",errorCorrectionLevel:"H",margin:4,width:720,color:{dark:"#142c20",light:"#ffffff"}}).then(value=>{if(!cancelled){setSvg(value);setError("");}}).catch(()=>{if(!cancelled)setError("Unable to generate QR code.");});return()=>{cancelled=true;};},[url]);
 const dataUri = useMemo(()=>svg?"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg):"",[svg]);
 function download(){if(!selected||!svg||!valid)return;const blob=new Blob([svg],{type:"image/svg+xml;charset=utf-8"});const link=document.createElement("a");const objectUrl=URL.createObjectURL(blob);link.href=objectUrl;link.download="podscape-"+selected.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-qr.svg";link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);}
 return <div className={styles.root} style={{"--label-size":valid?dimension+"cm":"3cm"} as React.CSSProperties}>
  <header className={styles.heading}><p>MANAGER / BIN LABELS</p><h1>Create QR Code</h1><span>Print a scannable label for a bin you already manage.</span></header>
  {bins.length===0?<div className={styles.empty}><p>You don't have any active bins yet.</p><Link href="/keeper/collection">Add a bin in Manager →</Link></div>:<>
   <section className={styles.card}><div className={styles.step}><b>01</b><h2>Select a bin</h2></div>
    <label htmlFor="qr-bin">Your existing bins</label>
    <select id="qr-bin" value={binId} onChange={event=>setBinId(event.target.value)}>{bins.map(bin=><option key={bin.id} value={bin.id}>{bin.species} — {bin.name}{bin.label?" · "+bin.label:""}</option>)}</select>
    {selected?<p className={styles.binDetails}><strong>{selected.species}</strong><span>{selected.name} · {selected.label||"No label"}</span></p>:null}
    <small>The QR links to this bin's unique record, even if you rename it later.</small>
   </section>
   <section className={styles.card}><div className={styles.step}><b>02</b><h2>Preview & size</h2></div>
    <div className={styles.preview}>{dataUri?<div className={styles.previewLabel}><img src={dataUri} alt="Scannable QR code preview for the selected bin"/><strong>{selected?.name}</strong><span>{selected?.species}</span></div>:<p>Generating preview…</p>}</div>
    <p className={styles.subheading}>Print dimensions</p>
    <div className={styles.sizes}>{sizes.map(n=><button type="button" key={n} className={custom===""&&size===n?styles.chosen:""} onClick={()=>{setSize(n);setCustom("");}}>{n} × {n} cm</button>)}</div>
    <label htmlFor="qr-custom">Custom square size (cm, optional)</label>
    <input id="qr-custom" type="number" min="2" max="10" step="0.5" inputMode="decimal" placeholder="Use selected preset" value={custom} onChange={event=>setCustom(event.target.value)}/>
    {!valid?<p className={styles.error}>Choose a size between 2 and 10 cm.</p>:<p className={styles.hint}>Physical label: {dimension} × {dimension} cm. For reliable scanning, 3 × 3 cm or larger is recommended.</p>}
   </section>
   <section className={styles.card}><div className={styles.step}><b>03</b><h2>Download or print</h2></div>
    <button type="button" className={styles.primary} disabled={!svg||!valid} onClick={()=>window.print()}>Print at actual size</button>
    <button type="button" className={styles.secondary} disabled={!svg||!valid} onClick={download}>Download QR (SVG)</button>
    <p className={styles.hint}>In your printer settings choose <strong>100% / Actual size</strong> and turn off “Fit to page.” SVG stays sharp at any size; the print layout controls the physical dimensions.</p>
    {error?<p className={styles.error} role="alert">{error}</p>:null}
   </section>
  </>}
  <div className={styles.printOnly}><div className={styles.printLabel}>{dataUri?<img src={dataUri} alt="QR code"/>:null}<strong>{selected?.name}</strong><span>{selected?.species}</span></div></div>
 </div>;
}
