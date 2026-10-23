"use client";
import {useState} from "react";
import type {ProductOptionType,ProductVariant} from "@/data/products";
import styles from "./ProductVariantsEditor.module.css";

type Editable={id:string;label:string;price:string;count:string};
const toEditable=(v:ProductVariant):Editable=>({id:v.id,label:v.label,price:(v.priceCents/100).toFixed(2),count:v.count?.toString()||""});
export function ProductVariantsEditor({initialType,initialVariants,basePrice}:{
 initialType:ProductOptionType;initialVariants:ProductVariant[];basePrice:number
}){
 const [kind,setKind]=useState<ProductOptionType>(initialType);
 const [rows,setRows]=useState<Editable[]>(initialVariants.map(toEditable));
 const add=(count?:number,label?:string)=>setRows(current=>[...current,{id:crypto.randomUUID(),label:label||(count?String(count):""),count:count?.toString()||"",price:(basePrice/100).toFixed(2)}]);
 const edit=(id:string,field:keyof Editable,value:string)=>setRows(current=>current.map(row=>row.id===id?{...row,[field]:value}:row));
 const serialized=JSON.stringify(rows.map(row=>({id:row.id,label:row.label.trim(),count:kind==="count"?Number(row.count):undefined,priceCents:Math.round(Number(row.price)*100)})));
 return <div className={styles.root}>
  <label htmlFor="product-option-type">Selling options</label>
  <select id="product-option-type" name="optionType" value={kind} onChange={event=>setKind(event.target.value as ProductOptionType)}>
    <option value="none">Single product · no options</option>
    <option value="count">Colony count · 8, 12, etc.</option>
    <option value="size">Size or style · S, M, L, etc.</option>
  </select>
  <input type="hidden" name="variantsJson" value={serialized}/>
  {kind!=="none"?<>
   <p className={styles.helper}>{kind==="count"?"Each count is a separate selectable pack with its own price.":"Use sizes or styles for apparel and other products. Each can have its own price."}</p>
   {rows.length===0?<p className={styles.empty}>Add at least one option before publishing.</p>:null}
   <div className={styles.rows}>{rows.map((row,index)=><div className={styles.variant} key={row.id}>
     {kind==="count"?<label><span>Count</span><input inputMode="numeric" type="number" min="1" max="100000" value={row.count} onChange={e=>{edit(row.id,"count",e.target.value);edit(row.id,"label",e.target.value?e.target.value+" count":"")}} required/></label>:<label><span>Size / style</span><input type="text" maxLength={60} value={row.label} onChange={e=>edit(row.id,"label",e.target.value)} placeholder="e.g. Medium" required/></label>}
     <label><span>Price (CAD)</span><input type="number" min="0" step=".01" value={row.price} onChange={e=>edit(row.id,"price",e.target.value)} required/></label>
     <button type="button" className={styles.remove} aria-label={`Remove option ${index+1}`} onClick={()=>setRows(current=>current.filter(item=>item.id!==row.id))}>×</button>
    </div>)}</div>
   <div className={styles.quick}>
    {kind==="count"?<><button type="button" onClick={()=>add(8,"8 count")}>+ 8 count</button><button type="button" onClick={()=>add(12,"12 count")}>+ 12 count</button></>:<>{["S","M","L","XL"].map(size=><button type="button" key={size} onClick={()=>add(undefined,size)}>+ {size}</button>)}</>}
    <button type="button" onClick={()=>add()}>+ Custom</button>
   </div>
   <p className={styles.helper}>The standard price field remains as the fallback; customers will see the selected option price in the Shop preview.</p>
  </>:<p className={styles.helper}>Suitable for one-size products without selectable counts or sizes.</p>}
 </div>;
}
