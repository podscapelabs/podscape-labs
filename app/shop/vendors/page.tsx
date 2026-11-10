import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {VendorDirectoryBrowser,type PublicVendor} from "./VendorDirectoryBrowser";
import styles from "./vendors.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Global Vendor Directory | PodScape",robots:{index:false,follow:false}};
export default async function VendorsPage(){
 const db=getSupabaseAdmin();
 const {data,error}=db?await db.from("vendor_profiles").select(
  "id,business_name,tagline,description,location_label,website_url,instagram_url,facebook_url,logo_path,country_code,shipping_mode,shipping_countries,shipping_notes,live_animal_shipping"
 ).eq("status","approved").order("business_name",{ascending:true}).limit(1000):{data:null,error:null};
 const vendors:PublicVendor[]=(data||[]).map(v=>({
  id:v.id,business_name:v.business_name,tagline:v.tagline,description:v.description,
  location_label:v.location_label,website_url:v.website_url,instagram_url:v.instagram_url,
  facebook_url:v.facebook_url,logo_url:v.logo_path&&db?db.storage.from("vendor-logos").getPublicUrl(v.logo_path).data.publicUrl:null,
  country_code:v.country_code||"",shipping_mode:v.shipping_mode||"not_specified",
  shipping_countries:Array.isArray(v.shipping_countries)?v.shipping_countries:[],
  shipping_notes:v.shipping_notes||"",live_animal_shipping:v.live_animal_shipping||"ask"
 }));
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <header className={styles.hero}><p>SHOP · GLOBAL DIRECTORY</p><h1>Discover vendors worldwide.</h1>
   <span>Find independent isopod breeders, artists and hobby businesses by location and shipping coverage.</span>
   <Link href="/shop/vendors/apply">List your business <span aria-hidden="true">→</span></Link>
  </header>
  {(!db||error)?<p className={styles.error}>Vendor listings are temporarily unavailable.</p>:
   <VendorDirectoryBrowser vendors={vendors}/>}
 </div></main></PlatformShell>;
}
