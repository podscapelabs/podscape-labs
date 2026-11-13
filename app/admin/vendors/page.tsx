import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {OwnerDeskHeader} from "@/components/OwnerDeskFoundation";
import Link from "next/link";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {reviewVendorProfile} from "@/app/shop/vendors/actions";
import {vendorCountryName,vendorShippingLabel} from "@/lib/vendor-regions";
import styles from "@/app/shop/vendors/vendors.module.css";
import ownerStyles from "./owner-vendors.module.css";
import {OwnerVendorForm,type OwnerListing} from "./OwnerVendorForm";
export const dynamic="force-dynamic";
export const metadata={title:"Vendor Desk | Owner Studio",robots:{index:false,follow:false}};
export default async function VendorReviewDesk(){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const db=getSupabaseAdmin();
 const {data,error}=db?await db.from("vendor_profiles").select("id,user_id,business_name,tagline,description,location_label,website_url,instagram_url,facebook_url,logo_path,status,updated_at,country_code,shipping_mode,shipping_countries,shipping_notes,live_animal_shipping")
  .order("updated_at",{ascending:false}).limit(200):{data:null,error:null};
 const vendors=data||[];
 return <main className={styles.page}><div className={styles.wrap}>
  <OwnerDeskHeader area="Commerce" title="Vendor Desk" description="Create directory listings and review vendor applications." icon="vendor" actions={[{href:"/shop/vendors",label:"Public directory",icon:"vendor",external:true}]}/>
  <div className={styles.topline}><strong>{vendors.filter(v=>v.user_id!==null&&v.status==="pending").length} applications awaiting review · {vendors.filter(v=>v.user_id===null).length} manually managed</strong><Link href="/shop/vendors">View public directory →</Link></div>
  <section className={ownerStyles.desk} aria-labelledby="owner-create-vendor"><div className={ownerStyles.deskTitle}><h2 id="owner-create-vendor">Add a vendor</h2><span>Owner-managed directory listing</span></div>
   <OwnerVendorForm/>
  </section>
  {vendors.some(v=>v.user_id===null)?<section className={ownerStyles.desk} aria-label="Manually managed vendors">
   <div className={ownerStyles.deskTitle}><h2>Manage your listings</h2><span>{vendors.filter(v=>v.user_id===null).length} manual entries</span></div>
   <div className={ownerStyles.entryList}>{vendors.filter(v=>v.user_id===null).map(v=><details key={v.id} className={ownerStyles.entry}>
    <summary><span>{v.business_name}</span><small>{v.status==="approved"?"Published":"Draft"}</small></summary>
    <OwnerVendorForm listing={v as OwnerListing}/>
   </details>)}</div>
  </section>:null}
  <div className={ownerStyles.deskTitle}><h2>Community applications</h2><span>Separate from manually managed listings</span></div>
  {!db||error?<p className={styles.error}>Vendor data is unavailable. The setup script may not have been applied.</p>:null}
  <div className={styles.cards}>{vendors.filter(v=>v.user_id!==null).map(v=><article key={v.id} className={styles.card}>
   <div className={styles.cardHead}>
    {v.logo_path&&db?<img src={db.storage.from("vendor-logos").getPublicUrl(v.logo_path).data.publicUrl} alt={v.business_name+" logo"}/>:<span className={styles.fallback} aria-hidden="true"><PodscapeLineIcon name="vendor"/></span>}
    <div><h2>{v.business_name}</h2><small>{v.location_label||"Location not provided"}</small></div>
   </div>
   <p className={styles.status}>Status: <strong>{v.status}</strong></p>
   <p className={styles.status}><strong>Home country:</strong> {v.country_code?vendorCountryName(v.country_code):"Not provided"} · <strong>Shipping:</strong> {vendorShippingLabel(v.shipping_mode)}</p>
   {v.shipping_mode==="selected"?<p className={styles.note}><strong>Approved destinations:</strong> {(v.shipping_countries||[]).map(vendorCountryName).join(", ")||"None"}</p>:null}
   <p className={styles.note}><strong>Live-isopod shipping:</strong> {v.live_animal_shipping==="yes"?"Yes (where permitted)":v.live_animal_shipping==="no"?"No":"Ask vendor / varies"}</p>
   {v.shipping_notes?<p className={styles.note}><strong>Shipping notes:</strong> {v.shipping_notes}</p>:null}
   {v.tagline?<p className={styles.tagline}>{v.tagline}</p>:null}
   {v.description?<p className={styles.description}>{v.description}</p>:null}
   <div className={styles.links}>{[v.website_url,v.instagram_url,v.facebook_url].filter(Boolean).map(url=>{let safe:URL|null=null;try{const parsed=new URL(url);if(parsed.protocol==="https:"&&!parsed.username&&!parsed.password)safe=parsed;}catch{}return safe?<a key={url} href={safe.href} target="_blank" rel="noopener noreferrer nofollow">{safe.hostname} ↗</a>:null;})}</div>
   <div className={styles.review}>
    {(["approved","rejected","pending"] as const).filter(status=>status!==v.status).map(status=><form key={status} action={reviewVendorProfile}>
     <input type="hidden" name="id" value={v.id}/><input type="hidden" name="status" value={status}/>
     <input type="hidden" name="expectedUpdatedAt" value={v.updated_at}/><input type="hidden" name="expectedStatus" value={v.status}/>
     <button type="submit" className={status==="approved"?styles.submit:styles.outline}>{status==="approved"?"Approve listing":status==="rejected"?"Reject":"Return to pending"}</button>
    </form>)}
   </div>
  </article>)}</div>
  {!vendors.some(v=>v.user_id!==null)&&!error?<p className={styles.empty}>No community vendor applications yet.</p>:null}
 </div></main>;
}
