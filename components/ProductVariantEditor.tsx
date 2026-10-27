"use client";

import { useState } from "react";
import type { ProductVariantRecord } from "@/data/products";
import styles from "./ProductVariantEditor.module.css";

function moneyInput(cents: number | null) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

function parseMoney(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export function ProductVariantEditor({ initialVariants }: { initialVariants: ProductVariantRecord[] }) {
  const [variants, setVariants] = useState(initialVariants.length ? initialVariants : [{ id: "", title: "Default", sku: "", priceCents: 0, compareAtPriceCents: null, inventoryTracked: true, inventoryQuantity: 0, lowStockThreshold: 5, isActive: true, sortOrder: 0 }]);
  const [priceDrafts, setPriceDrafts] = useState(() => (initialVariants.length ? initialVariants : [{ priceCents: 0, compareAtPriceCents: null }]).map((variant) => moneyInput(variant.priceCents) || "0.00"));
  const [compareDrafts, setCompareDrafts] = useState(() => (initialVariants.length ? initialVariants : [{ priceCents: 0, compareAtPriceCents: null }]).map((variant) => moneyInput(variant.compareAtPriceCents)));
  const activeCount = variants.filter((variant) => variant.isActive).length;
  const serializedVariants = variants.map((variant, index) => ({
    ...variant,
    priceCents: parseMoney(priceDrafts[index] || "") ?? -1,
    compareAtPriceCents: parseMoney(compareDrafts[index] || ""),
  }));

  function update(index: number, patch: Partial<ProductVariantRecord>) {
    setVariants((current) => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...patch } : variant));
  }

  function addVariant() {
    setVariants((current) => [...current, { id: "", title: `Option ${current.length + 1}`, sku: "", priceCents: 0, compareAtPriceCents: null, inventoryTracked: true, inventoryQuantity: 0, lowStockThreshold: 5, isActive: true, sortOrder: current.length }]);
    setPriceDrafts((current) => [...current, "0.00"]);
    setCompareDrafts((current) => [...current, ""]);
  }

  return <div className={styles.editor}>
    <input type="hidden" name="variants" value={JSON.stringify(serializedVariants)} />
    <div className={styles.heading}><div><strong>Variants</strong><p>Give each size or pack its own price, SKU and stock.</p></div><button type="button" onClick={addVariant}>＋ Add variant</button></div>
    {variants.map((variant, index) => <fieldset className={`${styles.variant} ${!variant.isActive ? styles.inactive : ""}`} key={variant.id || `new-${index}`}>
      <legend><span>{variant.title || `Variant ${index + 1}`}</span><span className={styles.variantState}>{variant.isActive ? "Active" : "Archived"}</span></legend>
      <div className={styles.fields}>
        <label><span>Option name</span><input value={variant.title} onChange={(event) => update(index, { title: event.target.value })} maxLength={120} required /></label>
        <label><span>SKU</span><input value={variant.sku} onChange={(event) => update(index, { sku: event.target.value })} maxLength={100} placeholder="Optional" /></label>
        <label><span>Price · CAD</span><input inputMode="decimal" type="number" min="0" step="0.01" value={priceDrafts[index] ?? "0.00"} onChange={(event) => setPriceDrafts((current) => current.map((value, variantIndex) => variantIndex === index ? event.target.value : value))} required /></label>
        <label><span>Compare-at price</span><input inputMode="decimal" type="number" min="0" step="0.01" value={compareDrafts[index] ?? ""} onChange={(event) => setCompareDrafts((current) => current.map((value, variantIndex) => variantIndex === index ? event.target.value : value))} placeholder="Optional" /></label>
        <label className={styles.check}><input type="checkbox" checked={variant.inventoryTracked} onChange={(event) => update(index, { inventoryTracked: event.target.checked })} /><span>Track inventory</span></label>
        <label><span>Quantity</span><input type="number" min="0" max="999999" step="1" value={variant.inventoryQuantity} disabled={!variant.inventoryTracked} onChange={(event) => update(index, { inventoryQuantity: Number(event.target.value) })} /></label>
        <label><span>Low-stock alert</span><input type="number" min="0" max="999999" step="1" value={variant.lowStockThreshold} disabled={!variant.inventoryTracked} onChange={(event) => update(index, { lowStockThreshold: Number(event.target.value) })} /></label>
        <button className={styles.toggle} type="button" onClick={() => update(index, { isActive: !variant.isActive })} disabled={variant.isActive && activeCount === 1} aria-label={`${variant.isActive ? "Archive" : "Restore"} ${variant.title}`}>
          {variant.isActive ? "Archive variant" : "Restore variant"}
        </button>
      </div>
    </fieldset>)}
  </div>;
}
