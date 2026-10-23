"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {formatProductPrice,productStockStatus,productCategories,type ProductRecord} from "@/data/products";
import styles from "./ShopManagerList.module.css";
type View="all"|"published"|"draft"|"archived"|"low";
export function ShopManagerList({products,selectedId}:{products:ProductRecord[];selectedId?:string}){
 const [query,setQuery]=useState("");
 const [view,setView]=useState<View>("all");
 const [category,setCategory]=useState("all");
 const [sort,setSort]=useState("updated");
 const [showAllMobile,setShowAllMobile]=useState(false);
 const counts={all:products.length,published:products.filter(p=>p.status==="published"&&!p.archivedAt).length,draft:products.filter(p=>p.status==="draft"&&!p.archivedAt).length,archived:products.filter(p=>p.archivedAt).length,low:products.filter(p=>!p.archivedAt&&["low-stock","out-of-stock"].includes(productStockStatus(p))).length};
 const filtered=useMemo(()=>products.filter(p=>{
  if(view==="archived"&&!p.archivedAt)return false;
  if(view!=="archived"&&p.archivedAt)return false;
  if(view==="published"&&p.status!=="published")return false;
  if(view==="draft"&&p.status!=="draft")return false;
  if(view==="low"&&!["low-stock","out-of-stock"].includes(productStockStatus(p)))return false;
  if(category!=="all"&&p.category!==category)return false;
  return [p.title,p.category,p.sku||"",p.slug,...(p.variants||[]).map(v=>v.sku||"")].join(" ").toLowerCase().includes(query.toLowerCase().trim());
 }).sort((a,b)=>sort==="name"?a.title.localeCompare(b.title):sort==="price"?(Math.min(...(a.variants?.length?a.variants.map(v=>v.priceCents):[a.priceCents]))-Math.min(...(b.variants?.length?b.variants.map(v=>v.priceCents):[b.priceCents]))):new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()),[products,view,category,query,sort]);
 const tabs: {key:View;label:string;count:number}[]=[{key:"all",label:"All",count:counts.all-counts.archived},{key:"published",label:"Published",count:counts.published},{key:"draft",label:"Drafts",count:counts.draft},{key:"low",label:"Low stock",count:counts.low},{key:"archived",label:"Archived",count:counts.archived}];
 return <div className={styles.manager}>
  <div className={styles.head}><strong>Product overview</strong><span>{products.length} records</span></div>
  <div className={styles.stats}><span>{counts.published} published</span><span>{counts.draft} drafts</span><span>{counts.low} need stock review</span></div>
  <label className={styles.search}><span>Find a product</span><input type="search" placeholder="Search name, SKU, category…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <div className={styles.tabs} role="group" aria-label="Filter by status">{tabs.map(tab=><button type="button" key={tab.key} aria-pressed={view===tab.key} onClick={()=>setView(tab.key)}>{tab.label} <span>{tab.count}</span></button>)}</div>
  <div className={styles.filters}><label><span>Category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{productCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="updated">Recently updated</option><option value="name">Name A–Z</option><option value="price">Price low–high</option></select></label></div>
  <div className={`${styles.items} ${showAllMobile?styles.expanded:""}`}>{filtered.map(p=>{
   const stock=productStockStatus(p);
   return <Link key={p.id} className={`${styles.item} ${selectedId===p.id?styles.selected:""}`} href={`/admin/products?record=${encodeURIComponent(p.id)}${p.archivedAt?"&view=archived":""}`}>
    <div className={styles.main}><strong>{p.title}</strong><small>{p.category}</small></div>
    <div className={styles.meta}><strong>{formatProductPrice(p)}</strong><small>{p.archivedAt?"Archived":p.status}{stock==="low-stock"?" · Low stock":stock==="out-of-stock"?" · Out of stock":""}</small></div>
   </Link>;
  })}{!filtered.length?<p className={styles.empty}>No products match these filters.</p>:null}</div>
  {filtered.length>3?<button type="button" className={styles.mobileExpand} onClick={()=>setShowAllMobile(v=>!v)}>{showAllMobile?"Collapse product list":"Browse more products"} ({filtered.length})</button>:null}
 </div>;
}
