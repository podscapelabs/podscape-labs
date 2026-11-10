"use client";
import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { importKeeperCsvRows, type ImportRow } from "./actions";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import styles from "./import.module.css";

type Species={id:string;name:string;scientific:string;morph:string};
type Field="species"|"name"|"label"|"quantity"|"status"|"notes";
const fields:Field[]=["species","name","label","quantity","status","notes"];
const labels:Record<Field,string>={
 species:"Species or morph",name:"Bin name",label:"Bin label / location",
 quantity:"Population",status:"Condition",notes:"Keeper notes"
};
const aliases:Record<Field,string[]>={
 species:["species","isopod","isopods","scientific name","scientificname","morph","species name","taxon"],
 name:["bin name","enclosure name","colony name","bin","enclosure","colony","name"],
 label:["bin id","bin number","label","location","bin label","rack","rack location","id"],
 quantity:["quantity","population","count","number","qty","total","estimated population"],
 status:["status","condition","colony status","health"],
 notes:["notes","keeper notes","comments","description","remarks"]
};
const normalize=(value:string)=>value.trim().toLocaleLowerCase("en-CA").replace(/[^a-z0-9]+/g," ");
function parseCsv(text:string):string[][]{
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 const input=text.replace(/^\uFEFF/,"");let i=0;
 while(i<input.length){
  const ch=input[i];
  if(quoted){if(ch==='"'&&input[i+1]==='"'){cell+='"';i+=2;continue;}
   if(ch==='"'){quoted=false;i++;continue;}cell+=ch;i++;continue;}
  if(ch==='"'&&cell===""){quoted=true;i++;continue;}
  if(ch===","){row.push(cell);cell="";i++;continue;}
  if(ch==="\n"||ch==="\r"){row.push(cell);if(row.some(value=>value.trim()))rows.push(row);row=[];cell="";if(ch==="\r"&&input[i+1]==="\n")i++;i++;continue;}
  cell+=ch;i++;
 }
 if(quoted)throw new Error("An unclosed quotation mark was found in the CSV.");
 row.push(cell);if(row.some(value=>value.trim()))rows.push(row);
 return rows;
}
const statusFrom=(value:string)=>{
 const normalized=normalize(value).replace(/ /g,"-");
 return ["planning","establishing","stable","thriving","declining","no-longer-kept"].includes(normalized)?normalized:"establishing";
};
export function ColonyCsvImporter({species}:{species:Species[]}){
 const router=useRouter();
 const [fileName,setFileName]=useState("");
 const [headers,setHeaders]=useState<string[]>([]);
 const [data,setData]=useState<string[][]>([]);
 const [map,setMap]=useState<Record<Field,number>>({species:-1,name:-1,label:-1,quantity:-1,status:-1,notes:-1});
 const [selected,setSelected]=useState<Record<number,string>>({});
 const [excluded,setExcluded]=useState<number[]>([]);
 const [error,setError]=useState("");
 const [result,setResult]=useState("");
 const [pending,start]=useTransition();
 const matches=useMemo(()=>{
  const index=new Map<string,Set<string>>();
  for(const item of species){
   const candidates=[item.name,item.scientific,item.morph,
    [item.scientific,item.morph].filter(Boolean).join(" "),
    [item.name,item.morph].filter(Boolean).join(" ")];
   for(const candidate of candidates){const key=normalize(candidate);if(!key)continue;
    if(!index.has(key))index.set(key,new Set());index.get(key)!.add(item.id);}
  }
  return index;
 },[species]);
 const analyzed=useMemo(()=>data.map((values,i)=>{
  const get=(field:Field)=>map[field]>=0?String(values[map[field]]||"").trim():"";
  const speciesText=get("species");
  const exact=matches.get(normalize(speciesText));
  const automatic=exact?.size===1?[...exact][0]:"";
  const speciesId=selected[i]===undefined?automatic:selected[i];
  const name=get("name")||get("label");
  const label=get("label");
  const rawQty=get("quantity");
  const quantity=rawQty===""?0:Number(rawQty);
  const notes=get("notes");
  const valid=!!speciesId&&!!name&&name.length<=80&&label.length<=70&&notes.length<=5000
   &&Number.isInteger(quantity)&&quantity>=0&&quantity<=99999;
  const row:ImportRow={speciesId,name,label,quantity,status:statusFrom(get("status")),notes};
  return {i,speciesText,row,valid,ambiguous:(exact?.size||0)>1};
 }),[data,map,matches,selected]);
 const active=analyzed.filter(r=>!excluded.includes(r.i));
 const ready=active.length>0&&active.every(r=>r.valid);
 async function loadFile(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];if(!file)return;
  setError("");setResult("");setHeaders([]);setData([]);setSelected({});setExcluded([]);
  if(!/\.csv$/i.test(file.name)||file.size>1024*1024){setError("Choose a CSV file no larger than 1 MB.");return;}
  try{
   const raw=await file.text();const rows=parseCsv(raw);
   if(rows.length<2)throw new Error("Add a header row and at least one colony.");
   if(rows.length>101)throw new Error("Import up to 100 colonies at a time.");
   const columns=rows[0].map(s=>s.trim());
   if(columns.length>40)throw new Error("This CSV has too many columns.");
   const guess={} as Record<Field,number>;
   for(const field of fields)guess[field]=columns.findIndex(h=>aliases[field].includes(normalize(h)));
   if(guess.species===-1)guess.species=columns.findIndex(h=>normalize(h).includes("species"));
   if(guess.name===-1)guess.name=columns.findIndex(h=>normalize(h).includes("bin"));
   setHeaders(columns);setData(rows.slice(1));setMap(guess);setFileName(file.name);
  }catch(e){setError(e instanceof Error?e.message:"Unable to read this CSV.");}
  event.target.value="";
 }
 function submit(){
  if(!ready||pending)return;
  setError("");setResult("");
  start(async()=>{
   try{
    const response=await importKeeperCsvRows({rows:active.map(r=>r.row)});
    if(!response.success){setError(response.error||"Import could not be completed.");return;}
    setResult(`Imported ${response.created} new ${response.created===1?"bin":"bins"}. ${response.skipped} existing ${response.skipped===1?"match was":"matches were"} safely skipped.`);
    router.refresh();
   }catch{setError("Could not reach Manager. Check your connection, then review your collection before retrying.");}
  });
 }
 function downloadTemplate(){
  const sample='Species,Bin name,Bin label,Population,Condition,Keeper notes\n"Dairy Cow","Dairy Cow A","Rack 2 - A",40,stable,"Example only - replace before importing"\n';
  const blob=new Blob([sample],{type:"text/csv;charset=utf-8"});
  const href=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=href;anchor.download="podscape-colony-import-template.csv";anchor.click();URL.revokeObjectURL(href);
 }
 return <div className={styles.container}>
  <section className={styles.panel}>
   <div className={styles.panelHead}><span className={styles.step}>01</span><div><h2>Choose your spreadsheet</h2><p>Export your Excel or Google Sheets inventory as CSV. Your original file stays on your device until you confirm the import.</p></div></div>
   <div className={styles.fileRow}><label className={styles.fileButton}><PodscapeLineIcon name="note"/> {fileName||"Choose CSV file"}<input type="file" accept=".csv,text/csv" onChange={loadFile}/></label><button type="button" onClick={downloadTemplate}>Download template</button></div>
   <p className={styles.helper}>Maximum 100 bins per file · 1 MB limit · Existing bins are never overwritten.</p>
  </section>
  {data.length>0?<><section className={styles.panel}>
   <div className={styles.panelHead}><span className={styles.step}>02</span><div><h2>Match your columns</h2><p>We suggested matches where possible. Adjust them to fit your spreadsheet.</p></div></div>
   <div className={styles.mapping}>{fields.map(field=><label key={field}>{labels[field]}{["species","name"].includes(field)?<small>Recommended</small>:null}
    <select value={map[field]} onChange={e=>{setMap(prev=>({...prev,[field]:Number(e.target.value)}));setSelected({});}}>
     <option value={-1}>Not included</option>{headers.map((h,i)=><option key={i} value={i}>{h||`Column ${i+1}`}</option>)}
    </select></label>)}</div>
   <p className={styles.helper}>Species must match a Leaf Ledger entry; names can fall back to the bin label. Blank populations default to zero.</p>
  </section>
  <section className={styles.panel}>
   <div className={styles.panelHead}><span className={styles.step}>03</span><div><h2>Review every bin</h2><p>Choose a Ledger species for any unmatched row. Uncheck entries you don't want to import.</p></div></div>
   <div className={styles.tally}>{active.length} selected · {active.filter(r=>r.valid).length} ready · {active.filter(r=>!r.valid).length} need attention</div>
   <div className={styles.rows}>{analyzed.map(({i,speciesText,row,valid,ambiguous})=><div className={styles.row} key={i}>
    <label className={styles.rowToggle}><input type="checkbox" checked={!excluded.includes(i)} onChange={e=>setExcluded(prev=>e.target.checked?prev.filter(x=>x!==i):[...prev,i])}/><strong>Row {i+2}</strong></label>
    <div className={styles.rowDetail}><strong>{row.name||"Missing bin name"}</strong><small>{row.label||"No label"} · {row.quantity} recorded</small></div>
    <label className={styles.speciesChoice}><span>{ambiguous?"Multiple species matched":speciesText||"Species not provided"}</span>
     <select aria-label={`Species for row ${i+2}`} value={row.speciesId} onChange={e=>setSelected(prev=>({...prev,[i]:e.target.value}))}>
      <option value="">Select Leaf Ledger species…</option>{species.map(s=><option key={s.id} value={s.id}>{s.name}{s.morph?` · ${s.morph}`:""} · {s.scientific}</option>)}
     </select>
    </label>
    <span className={valid?styles.ready:styles.needsReview}>{valid?"Ready":"Review"}</span>
   </div>)}</div>
   <div className={styles.actions}><button type="button" disabled={!ready||pending} onClick={submit}>{pending?"Importing…":`Import ${active.length} selected ${active.length===1?"bin":"bins"}`}</button><Link href="/keeper/collection">Cancel</Link></div>
   {error?<p role="alert" className={styles.error}>{error}</p>:null}
   {result?<p role="status" className={styles.success}>{result} <Link href="/keeper/collection">View your colonies →</Link></p>:null}
  </section></>:error?<p role="alert" className={styles.error}>{error}</p>:null}
 </div>;
}
