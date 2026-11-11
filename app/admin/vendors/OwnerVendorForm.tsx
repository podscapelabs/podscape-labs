"use client";
import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {saveOwnerVendor} from "./owner-actions";
import {vendorCountryOptions,vendorShippingModes,vendorCountryName,type VendorShippingMode} from "@/lib/vendor-regions";
import styles from "./owner-vendors.module.css";
export type OwnerListing={id:string;business_name:string;tagline:string;description:string;location_label:string;country_code:string;shipping_mode:string;shipping_countries:string[];shipping_notes:string;live_animal_shipping:string;website_url:string;instagram_url:string;facebook_url:string;status:string;updated_at:string;};
export function OwnerVendorForm({listing}:{listing?:OwnerListing}){
 const router=useRouter();const [busy,start]=useTransition();const [notice,setNotice]=useState("");const [success,setSuccess]=useState(false);
 const [mode,setMode]=useState<VendorShippingMode>((listing?.shipping_mode||"not_specified") as VendorShippingMode);
 const [countries,setCountries]=useState<string[]>(listing?.shipping_countries||[]);const [candidate,setCandidate]=useState("");
 const [status,setStatus]=useState(listing?.status==="approved"?"approved":"pending");
 const submit=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy)return;const payload=new FormData(e.currentTarget);setNotice("");
  start(async()=>{try{const response=await saveOwnerVendor(payload);setSuccess(response.success);setNotice(response.message);if(response.success)router.refresh();}
   catch{setSuccess(false);setNotice("Unable to save the listing. Please try again.");}});
 };
 return <form className={styles.form} onSubmit={submit}>
  <input type="hidden" name="id" value={listing?.id||""}/><input type="hidden" name="expectedUpdatedAt" value={listing?.updated_at||""}/>
  <div className={styles.fields}>
   <label>Business name <input name="businessName" required minLength={2} maxLength={80} defaultValue={listing?.business_name||""} placeholder="Business or breeder name"/></label>
   <label>Location <input name="location" maxLength={100} defaultValue={listing?.location_label||""} placeholder="City, province or region"/></label>
   <label>Home country <select name="countryCode" defaultValue={listing?.country_code||""}><option value="">Not specified</option>{vendorCountryOptions.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
   <label>Shipping availability <select name="shippingMode" value={mode} onChange={e=>{setMode(e.target.value as VendorShippingMode);setCountries([]);}}>{vendorShippingModes.map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select></label>
   {mode==="selected"?<div className={styles.wide}><label>Shipping destinations</label><div className={styles.destination}><select value={candidate} onChange={e=>setCandidate(e.target.value)} aria-label="Destination country"><option value="">Choose country</option>{vendorCountryOptions.filter(v=>!countries.includes(v.value)).map(v=><option key={v.value} value={v.value}>{v.label}</option>)}</select><button type="button" disabled={!candidate} onClick={()=>{if(candidate)setCountries(prev=>[...prev,candidate]);setCandidate("");}}>Add</button></div><div className={styles.chips}>{countries.map(c=><button key={c} type="button" onClick={()=>setCountries(prev=>prev.filter(v=>v!==c))}>{vendorCountryName(c)} ×</button>)}</div></div>:null}
   <input type="hidden" name="shippingCountries" value={mode==="selected"?countries.join(","):""}/>
   <label>Live isopod shipping <select name="liveAnimalShipping" defaultValue={listing?.live_animal_shipping||"ask"}><option value="ask">Ask vendor / unknown</option><option value="yes">Yes, where permitted</option><option value="no">No</option></select></label>
   <label className={styles.wide}>Shipping notes <textarea name="shippingNotes" maxLength={400} rows={2} defaultValue={listing?.shipping_notes||""}/></label>
   <label className={styles.wide}>Short introduction <input name="tagline" maxLength={140} defaultValue={listing?.tagline||""} placeholder="What does the business offer?"/></label>
   <label className={styles.wide}>Description <textarea name="description" maxLength={1000} rows={3} defaultValue={listing?.description||""}/></label>
   <label>Website <input type="url" name="website" maxLength={500} defaultValue={listing?.website_url||""} placeholder="https://"/></label>
   <label>Instagram <input type="url" name="instagram" maxLength={500} defaultValue={listing?.instagram_url||""} placeholder="https://"/></label>
   <label>Facebook <input type="url" name="facebook" maxLength={500} defaultValue={listing?.facebook_url||""} placeholder="https://"/></label>
   <label>Visibility <select name="status" value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Draft · hidden</option><option value="approved">Published · visible</option></select></label>
  </div>
  <p className={styles.hint}>Only publish details you have verified or have permission to share. Shipping information is vendor-reported. This entry will not be linked to a member account.</p>
  <button className={styles.save} type="submit" disabled={busy}>{busy?"Saving…":listing?"Save listing":"Create vendor listing"}</button>
  {notice?<p role={success?"status":"alert"} className={success?styles.success:styles.error}>{notice}</p>:null}
 </form>;
}
