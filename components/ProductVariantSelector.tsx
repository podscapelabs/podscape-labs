"use client";
import {useState} from "react";
import type {ProductOptionType,ProductVariant} from "@/data/products";
import styles from "./ProductVariantSelector.module.css";

export function ProductVariantSelector({variants,optionType,currency}:{
 variants:ProductVariant[];optionType:ProductOptionType;currency:"CAD"
}){
 const [selected,setSelected]=useState(0);
 const choice=variants[selected]||variants[0];
 const format=(value:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency}).format(value/100);
 if(!choice)return null;
 return <section className={styles.root} aria-label="Product purchase options">
  <div className={styles.head}><strong>{optionType==="count"?"Choose colony count":"Choose size or style"}</strong><span>{format(choice.priceCents)} CAD</span></div>
  <div className={styles.choices}>{variants.map((variant,index)=><button key={variant.id} type="button" aria-pressed={index===selected} onClick={()=>setSelected(index)}>{variant.label}</button>)}</div>
  <p>Checkout isn't available yet. Options and prices are displayed for preview only.</p>
 </section>;
}
