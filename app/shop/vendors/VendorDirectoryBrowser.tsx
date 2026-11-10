"use client";
import {useMemo,useState} from "react";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {VendorSocialIcon} from "@/components/VendorSocialIcon";
import {vendorCountryName,vendorCountryOptions,vendorShippingLabel,type VendorShippingMode} from "@/lib/vendor-regions";
import styles from "./vendors.module.css";

export type PublicVendor={
 id:string;business_name:string;tagline:string;description:string;location_label:string;
 website_url:string;instagram_url:string;facebook_url:string;logo_url:string|null;
 country_code:string;shipping_mode:VendorShippingMode;shipping_countries:string[];
 shipping_notes:string;live_animal_shipping:string;
};
function safeLink(value:string){try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function vendorShipsTo(v:PublicVendor,destination:string){
 if(!destination)return true;
 switch(v.shipping_mode){
  case "worldwide":return true;
  case "domestic":return v.country_code===destination;
  case "selected":return v.shipping_countries.includes(destination);
  default:return false;
 }
}
function ShippingText({vendor:v}:{vendor:PublicVendor}){
 if(v.shipping_mode==="selected")return <>{v.shipping_countries.length} selected {v.shipping_countries.length===1?"country":"countries"}</>;
 if(v.shipping_mode==="domestic")return <>Within {vendorCountryName(v.country_code)}</>;
 if(v.shipping_mode==="worldwide")return <>International shipping</>;
 if(v.shipping_mode==="pickup_only")return <>Local pickup / arrangements</>;
 return <>Shipping not specified</>;
}
function VendorCard({vendor:v}:{vendor:PublicVendor}){
 const links=[{name:"website" as const,label:"Website",url:v.website_url},{name:"instagram" as const,label:"Instagram",url:v.instagram_url},{name:"facebook" as const,label:"Facebook",url:v.facebook_url}].filter(x=>safeLink(x.url));
 return <article className={styles.card}>
  <div className={styles.cardHead}>
   {v.logo_url?<img src={v.logo_url} alt={v.business_name+" logo"} loading="lazy"/>:<span className={styles.fallback} aria-hidden="true"><PodscapeLineIcon name="vendor"/></span>}
   <div><h2>{v.business_name}</h2><small>{[v.location_label,v.country_code?vendorCountryName(v.country_code):""].filter(Boolean).join(" · ")||"Location not provided"}</small></div>
  </div>
  {v.tagline?<p className={styles.tagline}>{v.tagline}</p>:null}
  <div className={styles.shippingSummary}>
   <span className={styles.shippingIcon} aria-hidden="true"><PodscapeLineIcon name="shop"/></span>
   <span><strong><ShippingText vendor={v}/></strong><small>{v.live_animal_shipping==="yes"?"Live isopod shipping offered where permitted":v.live_animal_shipping==="no"?"No live-isopod shipping":"Live-isopod shipping: ask vendor"}</small></span>
  </div>
  <div className={styles.links}>{links.map(link=><a href={safeLink(link.url)!} target="_blank" rel="noopener noreferrer nofollow" key={link.name} aria-label={"Visit "+v.business_name+" on "+link.label}><VendorSocialIcon name={link.name}/><span>{link.label}</span></a>)}</div>
  {(v.description||v.shipping_notes||v.shipping_countries.length>0)?<details className={styles.vendorDetails}><summary>View vendor profile <PodscapeLineIcon name="arrow-down"/></summary>
   {v.description?<div className={styles.vendorBio}>{v.description}</div>:null}
   {v.shipping_mode==="selected"?<div className={styles.shipDetail}><strong>Shipping destinations</strong><p>{v.shipping_countries.map(vendorCountryName).join(" · ")}</p></div>:null}
   {v.shipping_notes?<div className={styles.shipDetail}><strong>Shipping information</strong><p>{v.shipping_notes}</p></div>:null}
  </details>:null}
 </article>;
}
export function VendorDirectoryBrowser({vendors}:{vendors:PublicVendor[]}){
 const [query,setQuery]=useState("");
 const [origin,setOrigin]=useState("");
 const [destination,setDestination]=useState("");
 const visible=useMemo(()=>{
  const q=query.trim().toLocaleLowerCase();
  return vendors.filter(v=>(!origin||v.country_code===origin)&&vendorShipsTo(v,destination)&&(!q||[v.business_name,v.tagline,v.description,v.location_label,v.country_code?vendorCountryName(v.country_code):""].some(x=>x.toLocaleLowerCase().includes(q))));
 },[vendors,query,origin,destination]);
 const options=vendorCountryOptions;
 return <>
  <div className={styles.directoryFilters}>
   <label className={styles.searchField}><span><PodscapeLineIcon name="search"/> Find a vendor</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Business, specialty, location…" maxLength={90}/></label>
   <label><span>Based in</span><select value={origin} onChange={e=>setOrigin(e.target.value)}><option value="">All countries</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
   <label><span>Ships to</span><select value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Any destination</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
  </div>
  <div className={styles.topline}><strong>{visible.length} {visible.length===1?"vendor":"vendors"} found</strong>{origin||destination||query?<button type="button" className={styles.clearFilters} onClick={()=>{setQuery("");setOrigin("");setDestination("");}}>Clear filters</button>:<span>Showing approved listings</span>}</div>
  {visible.length?<div className={styles.cards}>{visible.map(v=><VendorCard key={v.id} vendor={v}/>)}</div>:<div className={styles.empty}><h2>No matching vendors yet.</h2><p>Try another country or remove the shipping filter. Vendors must provide their shipping information before appearing in destination searches.</p><button type="button" className={styles.outline} onClick={()=>{setQuery("");setOrigin("");setDestination("");}}>Show all vendors</button></div>}
  <p className={styles.note}>Shipping coverage is provided by each vendor and is not a guarantee of delivery. Live-animal shipping depends on local laws, weather, carrier rules, and product type. Contact the vendor before ordering.</p>
 </>;
}
