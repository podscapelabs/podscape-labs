"use client";
import {useState} from "react";
import styles from "./OwnerQuickFields.module.css";
export function ProductPriceQuickPick({initial}:{initial:string}){
 const [price,setPrice]=useState(initial);
 return <div className={styles.picker}><label htmlFor="owner-product-price">Price · CAD</label><input id="owner-product-price" name="price" type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/><div className={styles.pills}>{["10.00","12.00","15.00","20.00","25.00","35.00","45.00","65.00"].map(p=><button type="button" key={p} aria-pressed={price===p} onClick={()=>setPrice(p)}>${p}</button>)}</div><p className={styles.help}>Quick prices are editable. Always confirm your final price before publishing.</p></div>;
}
