import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {VendorApplication,type VendorDraft} from "../VendorApplication";
import styles from "../vendors.module.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Become a Vendor | PodScape",robots:{index:false,follow:false}};
export default async function ApplyVendor(){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const admin=getSupabaseAdmin();
 const {data:existing,error}=user&&admin?await admin.from("vendor_profiles")
  .select("business_name,tagline,description,location_label,website_url,instagram_url,facebook_url,logo_path,status")
  .eq("user_id",user.id).maybeSingle():{data:null,error:null};
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <Link href="/shop/vendors" className={styles.back}>← Vendor Directory</Link>
  <header className={styles.hero}><p>VENDOR DIRECTORY · APPLY</p><h1>Your business, your profile.</h1><span>Tell the PodScape community what you offer. All vendor listings are reviewed before they appear.</span></header>
  {!user?<section className={styles.panel}><h2>Sign in to apply</h2><p>A PodScape member account keeps your listing yours to edit.</p><Link href="/account/login">Sign in →</Link></section>
   :!user.email_confirmed_at?<section className={styles.panel}><h2>Confirm your email</h2><p>Confirm your email address before applying to the directory.</p></section>
   :(!admin||error)?<section className={styles.panel}><h2>Applications unavailable</h2><p>The vendor database needs to be configured before submissions can open.</p></section>
   :<section className={styles.panel}><h2>{existing?"Manage your vendor profile":"Apply to the Vendor Directory"}</h2><p>Complete your public profile below. You can come back to edit it whenever you like.</p><VendorApplication draft={existing as VendorDraft|null}/></section>}
 </div></main></PlatformShell>;
}
