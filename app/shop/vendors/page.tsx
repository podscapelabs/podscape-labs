import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import styles from "./vendors.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Vendor Directory | PodScape",robots:{index:false,follow:false}};
type Vendor={id:string;business_name:string;tagline:string;description:string;
 location_label:string;website_url:string;instagram_url:string;facebook_url:string;logo_path:string};
function externalLink(url:string){try{const u=new URL(url);return u.protocol==="https:"?u.href:null;}catch{return null;}}
export default async function VendorsPage(){
 const db=getSupabaseAdmin();
 const {data,error}=db?await db.from("vendor_profiles").select("id,business_name,tagline,description,location_label,website_url,instagram_url,facebook_url,logo_path")
  .eq("status","approved").order("business_name",{ascending:true}):{data:null,error:null};
 const vendors=(data||[]) as Vendor[];
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <header className={styles.hero}><p>SHOP · COMMUNITY</p><h1>Meet our vendors</h1><span>Independent breeders, makers and studios from the PodScape community.</span><Link href="/shop/vendors/apply">List your business →</Link></header>
  <div className={styles.topline}><strong>Vendor Directory</strong><span>{vendors.length} approved {vendors.length===1?"listing":"listings"}</span></div>
  {(!db||error)?<p className={styles.error}>Vendor listings are temporarily unavailable.</p>:null}
  <div className={styles.cards}>{vendors.map(v=><article key={v.id} className={styles.card}>
   <div className={styles.cardHead}>
    {v.logo_path&&db?<img src={db.storage.from("vendor-logos").getPublicUrl(v.logo_path).data.publicUrl} alt={v.business_name+" logo"} loading="lazy"/>:<span className={styles.fallback} aria-hidden="true"><PodscapeLineIcon name="vendor"/></span>}
    <div><h2>{v.business_name}</h2><small>{v.location_label||"Independent vendor"}</small></div>
   </div>
   {v.tagline?<p className={styles.tagline}>{v.tagline}</p>:null}
   {v.description?<p className={styles.description}>{v.description}</p>:null}
   <div className={styles.links}>
    {([{url:v.website_url,label:"Website"},{url:v.instagram_url,label:"Instagram"},{url:v.facebook_url,label:"Facebook"}]).map(x=>externalLink(x.url)?<a key={x.label} href={externalLink(x.url)!} target="_blank" rel="noopener noreferrer nofollow">{x.label} ↗</a>:null)}
   </div>
  </article>)}</div>
  {!vendors.length&&db&&!error?<div className={styles.empty}><h2>Our directory is growing.</h2><p>Own an isopod business or create something for the hobby? Submit your profile for review.</p><Link href="/shop/vendors/apply">Become a listed vendor →</Link></div>:null}
  <p className={styles.note}>Vendor listings link to independent businesses. PodScape does not handle their purchases, payments, or delivery.</p>
 </div></main></PlatformShell>;
}
