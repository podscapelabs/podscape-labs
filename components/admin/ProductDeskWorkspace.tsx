"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import type {ProductRecord} from "@/data/products";
import {productCategories,formatProductPrice} from "@/data/products";
import {saveProductRecord,pullProductDetailsFromLedger} from "@/app/admin/products/actions";
import {ProductVariantsEditor} from "@/components/admin/ProductVariantsEditor";
import {ProductPriceQuickPick} from "@/components/admin/ProductPriceQuickPick";
import {ProductPhotoEditor} from "@/components/ProductPhotoEditor";
import styles from "./ProductDeskWorkspace.module.css";

type LedgerChoice={id:string;name:string;scientificName:string;catalogueNumber:string;identityStatus:string};
type Panel="ledger"|"pricing"|"packs"|"photos"|"copy"|"publish";
const panelName:Record<Panel,string>={ledger:"Leaf Ledger",pricing:"Pricing",packs:"Packs & sizes",photos:"Photos",copy:"Listing copy",publish:"Publish settings"};

export function ProductDeskWorkspace({product,ledgerChoices}:{product:ProductRecord;ledgerChoices:LedgerChoice[]}){
 const [opened,setOpened]=useState<Panel[]>(["pricing","copy","publish"]);
 const [dirty,setDirty]=useState(false);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 const [category,setCategory]=useState(product.category);
 const [linkedId,setLinkedId]=useState(product.ledgerSpeciesId||"");
 const linked=ledgerChoices.find(record=>record.id===linkedId);
 const linkedSupported=category==="Isopods & Springtails";
 const toggle=(panel:Panel)=>setOpened(current=>current.includes(panel)?current.filter(p=>p!==panel):[...current,panel]);
 const card=(panel:Panel,summary:string,body:React.ReactNode)=>{
  const open=opened.includes(panel);
  return <section className={`${styles.card} ${open?styles.open:""}`} key={panel}>
   <button type="button" className={styles.cardHead} aria-expanded={open} onClick={()=>toggle(panel)}>
    <span className={styles.icon} aria-hidden="true">{({ledger:"♧",pricing:"◇",packs:"▦",photos:"▧",copy:"≡",publish:"⚙"} as Record<Panel,string>)[panel]}</span>
    <span className={styles.cardText}><strong>{panelName[panel]}</strong><small>{summary}</small></span>
    <span className={styles.chevron} aria-hidden="true">{open?"−":"›"}</span>
   </button>
   <div className={`${styles.panelBody} ${open?styles.panelVisible:""}`} aria-hidden={!open}>
    {body}
    <div className={styles.panelActions}><button type="button" className={styles.close} onClick={()=>toggle(panel)}>Close</button><button type="submit" className={styles.savePanel}>Save product</button></div>
   </div>
  </section>;
 };
 return <form className={styles.workspace} action={saveProductRecord} onChange={()=>setDirty(true)} onSubmitCapture={(event)=>{
  const submitter=(event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;
  if(submitter?.formAction && submitter.formAction.includes("pullProductDetailsFromLedger") && dirty){
   if(!window.confirm("Pulling Ledger details will replace some listing fields. Save your current changes first. Continue?")){event.preventDefault();return;}
  }
  setDirty(false);
 }}>
  <input type="hidden" name="id" value={product.id}/>
  <div className={styles.top}>
   <div className={styles.picture}>{product.image?<Image src={product.image} alt={product.imageAlt||product.title} fill sizes="96px" unoptimized/>:<span>Photo</span>}</div>
   <div className={styles.topCopy}><strong>{product.title}</strong><small>{category}</small><span>{product.status==="published"?"● Published":"○ Draft"} · {formatProductPrice(product)}</span></div>
   <a className={styles.preview} href={`/shop/${product.slug}`} target="_blank" rel="noopener noreferrer">Preview ↗</a>
  </div>
  <div className={styles.cards}>
   {card("ledger",!linkedSupported?"Optional for species listings":linked?`${linked.name} · ${linked.catalogueNumber}`:"No species linked",
    <div className={styles.fields}>
     {!linkedSupported?<><input type="hidden" name="ledgerSpeciesId" value=""/><p className={styles.note}>Leaf Ledger import is optional and only applies to Isopods & Springtails. Other categories remain independent.</p></>:<>
      <label>Species record<select name="ledgerSpeciesId" value={linkedId} onChange={e=>setLinkedId(e.target.value)}><option value="">Choose a Ledger species</option>{ledgerChoices.map(s=><option key={s.id} value={s.id}>{s.name} · {s.catalogueNumber}</option>)}</select></label>
      {linked?<div className={styles.linked}><strong>{linked.name}</strong><small>{linked.scientificName} · {linked.catalogueNumber}</small></div>:null}
      <button type="submit" className={styles.pull} formAction={pullProductDetailsFromLedger} disabled={!linkedId}>Pull details from Ledger ↓</button>
      <p className={styles.note}>Pull copies the species name, available summary, care description, tags and a photo if your product has none. It does not change pricing or publication. Save other unsaved edits before pulling.</p>
     </>}
    </div>)}

   {card("pricing",product.variants?.length?`${formatProductPrice(product)} · ${product.variants.length} options`:formatProductPrice(product),
    <div className={styles.fields}><div className={styles.pricingInline}><ProductPriceQuickPick key={product.id} initial={(product.priceCents/100).toFixed(2)}/><div className={styles.variantInline}><ProductVariantsEditor key={product.id} initialType={product.optionType||"none"} initialVariants={product.variants||[]} basePrice={product.priceCents}/></div></div></div>)}
   {card("photos",product.image?"Product photo added":"Add or adjust photos",
    <div className={styles.fields}><ProductPhotoEditor key={product.id} image={product.image} imagePositionX={product.imagePositionX} imagePositionY={product.imagePositionY} imageZoom={product.imageZoom}/>
     {product.image?<label className={styles.check}><input type="checkbox" name="removePhoto" value="yes"/> Remove existing photo</label>:null}
     <label>Image description<input name="imageAlt" defaultValue={product.imageAlt}/></label>
    </div>)}
   {card("copy",product.summary||"Name, summary & description",
    <div className={styles.fields}><label>Product title<input name="title" required defaultValue={product.title}/></label><label>Short summary<textarea name="summary" rows={2} defaultValue={product.summary}/></label><label>Full description<textarea name="description" rows={4} defaultValue={product.description}/></label><label>Tags<input name="tags" defaultValue={product.tags.join(", ")}/></label></div>)}
   {card("publish",`${category} · ${product.status}`,
    <div className={styles.fields}>
     <label>Shop category<select name="category" value={category} onChange={e=>setCategory(e.target.value)}>{productCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}</select></label>
     <div className={styles.two}><label>Publication<select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="published">Published</option></select></label><label>Availability<select name="availability" defaultValue={product.availability}><option value="coming-soon">Coming soon</option><option value="in-stock">In stock</option><option value="sold-out">Sold out</option></select></label></div>
     <label className={styles.check}><input type="checkbox" name="featured" value="yes" defaultChecked={product.featured}/> Feature in Shop</label>
     <label>URL slug<input name="slug" defaultValue={product.slug}/></label>
     <label>Single-item SKU<input name="sku" maxLength={64} placeholder="Optional" defaultValue={product.sku||""}/></label>
     <div className={styles.two}><label>Single-item stock (blank = untracked)<input name="stockQuantity" type="number" min="0" step="1" placeholder="Not tracked" defaultValue={product.stockQuantity??""}/></label><label>Low stock threshold<input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={product.lowStockThreshold??3}/></label></div>
     <p className={styles.note}>For packs or sizes, manage inventory and SKUs separately under Pricing. Inventory tracking is optional; checkout remains disabled.</p>
     {product.stockHistory?.length ? <details><summary>Recent inventory changes ({product.stockHistory.length})</summary><ul>{product.stockHistory.slice(0,8).map((entry,index)=><li key={`${entry.at}-${index}`}>{new Date(entry.at).toLocaleDateString("en-CA")} · {entry.label}: {entry.before??"Untracked"} → {entry.after??"Untracked"}</li>)}</ul></details> : null}
     <label>Materials / contents<textarea name="materials" rows={2} defaultValue={product.materials}/></label>
     <label>Shipping note<textarea name="shippingNote" rows={2} defaultValue={product.shippingNote}/></label>
    </div>)}
  </div>
  <div className={styles.footer}><span role="status">{dirty?"Unsaved changes · save before leaving":"Shop preview · checkout disabled"}</span><button type="submit">Save product</button></div>
 </form>;
}
