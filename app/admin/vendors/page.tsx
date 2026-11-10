import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {reviewVendorProfile} from "@/app/shop/vendors/actions";
import styles from "@/app/shop/vendors/vendors.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Vendor Applications | Owner Studio",robots:{index:false,follow:false}};
export default async function VendorReviewDesk(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const db=getSupabaseAdmin();
 const {data,error}=db?await db.from("vendor_profiles").select("id,user_id,business_name,tagline,description,location_label,website_url,instagram_url,facebook_url,logo_path,status,updated_at")
  .order("updated_at",{ascending:false}).limit(200):{data:null,error:null};
 const vendors=data||[];
 return <main className={styles.page}><div className={styles.wrap}>
  <Link className={styles.back} href="/account/owner-tools">← Owner Studio</Link>
  <header className={styles.hero}><p>OWNER STUDIO · VENDORS</p><h1>Vendor applications</h1><span>Review business profiles before they appear in the public directory.</span></header>
  <div className={styles.topline}><strong>{vendors.filter(v=>v.status==="pending").length} awaiting review</strong><Link href="/shop/vendors">View public directory →</Link></div>
  {!db||error?<p className={styles.error}>Vendor data is unavailable. The setup script may not have been applied.</p>:null}
  <div className={styles.cards}>{vendors.map(v=><article key={v.id} className={styles.card}>
   <div className={styles.cardHead}>
    {v.logo_path&&db?<img src={db.storage.from("vendor-logos").getPublicUrl(v.logo_path).data.publicUrl} alt={v.business_name+" logo"}/>:<span className={styles.fallback}>✦</span>}
    <div><h2>{v.business_name}</h2><small>{v.location_label||"Location not provided"}</small></div>
   </div>
   <p className={styles.status}>Status: <strong>{v.status}</strong></p>
   {v.tagline?<p className={styles.tagline}>{v.tagline}</p>:null}
   {v.description?<p className={styles.description}>{v.description}</p>:null}
   <div className={styles.links}>{[v.website_url,v.instagram_url,v.facebook_url].filter(Boolean).map(url=>{let safe:URL|null=null;try{const parsed=new URL(url);if(parsed.protocol==="https:"&&!parsed.username&&!parsed.password)safe=parsed;}catch{}return safe?<a key={url} href={safe.href} target="_blank" rel="noopener noreferrer nofollow">{safe.hostname} ↗</a>:null;})}</div>
   <div className={styles.review}>
    {(["approved","rejected","pending"] as const).filter(status=>status!==v.status).map(status=><form key={status} action={reviewVendorProfile}>
     <input type="hidden" name="id" value={v.id}/><input type="hidden" name="status" value={status}/>
     <button type="submit" className={status==="approved"?styles.submit:styles.outline}>{status==="approved"?"Approve listing":status==="rejected"?"Reject":"Return to pending"}</button>
    </form>)}
   </div>
  </article>)}</div>
  {!vendors.length&&!error?<p className={styles.empty}>No vendor applications yet.</p>:null}
 </div></main>;
}
