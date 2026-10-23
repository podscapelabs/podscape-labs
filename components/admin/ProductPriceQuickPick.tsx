"use client";
import {useState} from "react";
import styles from "./OwnerQuickFields.module.css";
export function ProductPriceQuickPick({initial}:{initial:string}){
 const [price,setPrice]=useState(initial);
 return <div className={styles.picker}><label htmlFor="owner-product-price">Base price · CAD</label><input id="owner-product-price" name="price" type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></div>;
}
