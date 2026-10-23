"use client";
import {useState} from "react";
import type {ProductOptionType,ProductVariant} from "@/data/products";
import styles from "./ProductVariantsEditor.module.css";

type Editable={id:string;label:string;price:string;count:string;sku:string;stock:string;threshold:string};
const toEditable=(v:ProductVariant):Editable=>({id:v.id,label:v.label,price:(v.priceCents/100).toFixed(2),count:v.count?.toString()||"",sku:v.sku||"",stock:v.stockQuantity?.toString()??"",threshold:(v.lowStockThreshold??3).toString()});
export function ProductVariantsEditor({initialType,initialVariants,basePrice}:{initialType:ProductOptionType;initialVariants:ProductVariant[];basePrice:number}){
 const [kind,setKind]=useState<ProductOptionType>(initialType);
 const [rows,setRows]=useState<Editable[]>(initialVariants.map(toEditable));
 const [custom,setCustom]=useState("");
 const add=(count?:number,label?:string)=>{
  const name=label||(count?count+" count":"");
  if(rows.some(row=>kind==="count"&&Number(row.count)===count||kind==="size"&&row.label===name))return;
  setRows(current=>[...current,{id:crypto.randomUUID(),label:name,count:count?.toString()||"",price:(basePrice/100).toFixed(2),sku:"",stock:"",threshold:"3"}]);
 };
 const choose=(next:ProductOptionType)=>{
  setKind(next);
  if(next!==kind) setRows([]);
 };
 const edit=(id:string,field:keyof Editable,value:string)=>setRows(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));
 const serialized=JSON.stringify(rows.map(row=>({id:row.id,label:row.label.trim(),count:kind==="count"?Number(row.count):undefined,priceCents:Math.round(Number(row.price)*100),sku:row.sku.trim(),stockQuantity:row.stock===""?null:Number(row.stock),lowStockThreshold:Number(row.threshold)})));
 return <div className={styles.root}>
  <strong className={styles.heading}>Sell as</strong>
  <div className={styles.mode} role="group" aria-label="Product selling format">
   {([{value:"none",label:"Single item"},{value:"count",label:"Colony packs"},{value:"size",label:"Sizes / styles"}] as const).map(option=><button key={option.value} type="button" aria-pressed={kind===option.value} onClick={()=>choose(option.value)}>{option.label}</button>)}
  </div>
  <input type="hidden" name="optionType" value={kind}/>
  <input type="hidden" name="variantsJson" value={serialized}/>
  {kind==="count"?<div className={styles.presets}><span>Add pack</span><button type="button" onClick={()=>add(8)}>+ 8</button><button type="button" onClick={()=>add(10)}>+ 10</button><button type="button" onClick={()=>add(12)}>+ 12</button><div className={styles.custom}><input aria-label="Custom colony count" type="number" inputMode="numeric" min="1" max="100000" placeholder="Other" value={custom} onChange={event=>setCustom(event.target.value)}/><button type="button" onClick={()=>{const n=Number(custom);if(Number.isSafeInteger(n)&&n>0&&n<=100000){add(n);setCustom("");}}}>Add</button></div></div>:null}
  {kind==="size"?<div className={styles.presets}><span>Add size</span>{["S","M","L","XL"].map(label=><button type="button" key={label} onClick={()=>add(undefined,label)}>+ {label}</button>)}<button type="button" onClick={()=>add(undefined,"Custom")}>+ Other</button></div>:null}
  {kind!=="none"?<div className={styles.rows}>{rows.length===0?<p className={styles.empty}>Choose options above to set their individual prices.</p>:rows.map((row,index)=><div key={row.id} className={styles.variant}>
   <label><span>{kind==="count"?"Pack":"Size / style"}</span>{kind==="count"?<input type="number" min="1" max="100000" inputMode="numeric" aria-label={"Pack count "+(index+1)} value={row.count} onChange={e=>setRows(current=>current.map(item=>item.id===row.id?{...item,count:e.target.value,label:e.target.value+" count"}:item))}/>:<input type="text" maxLength={60} value={row.label} onChange={e=>edit(row.id,"label",e.target.value)}/>}</label>
   <label><span>Price · CAD</span><input type="number" min="0" step=".01" value={row.price} onChange={e=>edit(row.id,"price",e.target.value)}/></label>
   <label><span>SKU</span><input type="text" maxLength={64} placeholder="Optional" value={row.sku} onChange={e=>edit(row.id,"sku",e.target.value)}/></label>
   <label><span>Stock (blank = untracked)</span><input type="number" min="0" step="1" placeholder="Not tracked" value={row.stock} onChange={e=>edit(row.id,"stock",e.target.value)}/></label>
   <label><span>Low stock at</span><input type="number" min="0" step="1" value={row.threshold} onChange={e=>edit(row.id,"threshold",e.target.value)}/></label>
   <button type="button" className={styles.remove} aria-label={"Remove option "+(index+1)} onClick={()=>setRows(current=>current.filter(item=>item.id!==row.id))}>×</button>
  </div>)}</div>:null}
 </div>;
}
