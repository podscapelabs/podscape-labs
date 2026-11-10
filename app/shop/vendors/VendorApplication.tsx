"use client";
import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {submitVendorProfile} from "./actions";
import styles from "./vendors.module.css";
import {vendorCountryOptions,vendorCountryName,vendorShippingModes,type VendorShippingMode} from "@/lib/vendor-regions";
export type VendorDraft={business_name:string;tagline:string;description:string;location_label:string;
 website_url:string;instagram_url:string;facebook_url:string;logo_path:string;status:string;
 country_code:string;shipping_mode:VendorShippingMode;shipping_countries:string[];shipping_notes:string;live_animal_shipping:string};
export function VendorApplication({draft}:{draft:VendorDraft|null}){
 const router=useRouter();const [pending,start]=useTransition();
 const [message,setMessage]=useState("");const [ok,setOk]=useState(false);
 const [preview,setPreview]=useState("");
 const [shippingMode,setShippingMode]=useState<VendorShippingMode>(draft?.shipping_mode||"not_specified");
 const [destinations,setDestinations]=useState<string[]>(draft?.shipping_countries||[]);
 const [newDestination,setNewDestination]=useState("");
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(pending)return;
  const form=new FormData(e.currentTarget);setMessage("");
  start(async()=>{try{const r=await submitVendorProfile(form);setOk(r.success);setMessage(r.message);if(r.success)router.refresh();}
   catch{setOk(false);setMessage("Unable to submit right now. Please try again.");}});
 }
 return <form className={styles.form} onSubmit={submit}>
  {draft?<p className={styles.status}>Current review status: <strong>{draft.status}</strong>. Editing resubmits your profile for approval.</p>:null}
  <div className={styles.fields}>
   <label>Business name <span>Required</span><input name="businessName" maxLength={80} minLength={2} required defaultValue={draft?.business_name||""} placeholder="Your breeder or studio name"/></label>
   <label>Location <span>Optional</span><input name="location" maxLength={100} defaultValue={draft?.location_label||""} placeholder="Hamilton, Ontario · Canada"/></label>
   <label>Home country <span>For international region search</span><select name="countryCode" defaultValue={draft?.country_code||""}><option value="">Select country</option>{vendorCountryOptions.map(country=><option key={country.value} value={country.value}>{country.label}</option>)}</select></label>
   <label>Shipping coverage <span>Vendor-stated, subject to laws</span><select name="shippingMode" value={shippingMode} onChange={e=>{setShippingMode(e.target.value as VendorShippingMode);setDestinations([]);}}>{vendorShippingModes.map(mode=><option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
   {shippingMode==="selected"?<div className={styles.wide}><label>Countries you ship to <span>Select one country at a time</span></label><div className={styles.destinationChooser}><select aria-label="Select shipping destination" value={newDestination} onChange={e=>setNewDestination(e.target.value)}><option value="">Choose destination</option>{vendorCountryOptions.filter(item=>!destinations.includes(item.value)).map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><button className={styles.outline} type="button" disabled={!newDestination} onClick={()=>{if(newDestination&&!destinations.includes(newDestination))setDestinations(prev=>[...prev,newDestination]);setNewDestination("");}}>Add country</button></div><div className={styles.chips}>{destinations.map(code=><button type="button" key={code} onClick={()=>setDestinations(prev=>prev.filter(item=>item!==code))} aria-label={"Remove "+vendorCountryName(code)}>{vendorCountryName(code)} ×</button>)}</div></div>:null}
   <input type="hidden" name="shippingCountries" value={shippingMode==="selected"?destinations.join(","):""}/>
   <label>Shipping live isopods? <span>Subject to destination restrictions</span><select name="liveAnimalShipping" defaultValue={draft?.live_animal_shipping||"ask"}><option value="ask">Ask vendor / varies</option><option value="yes">Yes, where legally permitted</option><option value="no">No</option></select></label>
   <label className={styles.wide}>Shipping details <span>Optional · 400 characters, e.g. seasonal limits or pickup notes</span><textarea name="shippingNotes" rows={3} maxLength={400} defaultValue={draft?.shipping_notes||""} placeholder="Shipping availability depends on season, destination, and product type. Contact us to confirm."/></label>
   <label className={styles.wide}>Short introduction <span>140 characters</span><input name="tagline" maxLength={140} defaultValue={draft?.tagline||""} placeholder="A little about what you offer"/></label>
   <label className={styles.wide}>About your business <span>Up to 1,000 characters</span><textarea name="description" rows={4} maxLength={1000} defaultValue={draft?.description||""} placeholder="What do you breed, make, or specialize in?"/></label>
   <label>Website <span>HTTPS URL</span><input name="website" type="url" maxLength={500} defaultValue={draft?.website_url||""} placeholder="https://yourshop.com"/></label>
   <label>Instagram <span>HTTPS URL</span><input name="instagram" type="url" maxLength={500} defaultValue={draft?.instagram_url||""} placeholder="https://instagram.com/..."/></label>
   <label>Facebook <span>HTTPS URL</span><input name="facebook" type="url" maxLength={500} defaultValue={draft?.facebook_url||""} placeholder="https://facebook.com/..."/></label>
   <label>Business logo <span>PNG, JPG or WebP · Max 2 MB</span>
    <input name="logo" type="file" accept="image/png,image/jpeg,image/webp"
     onChange={e=>{const file=e.target.files?.[0];if(!file){setPreview("");return;}
      if(file.size>2097152){setOk(false);setMessage("That logo exceeds 2 MB.");e.target.value="";return;}
      const reader=new FileReader();reader.onload=()=>setPreview(typeof reader.result==="string"?reader.result:"");reader.readAsDataURL(file);}}/>
   </label>
  </div>
  {preview?<div className={styles.logoPreview}><img src={preview} alt="Selected logo preview"/></div>:draft?.logo_path?<p className={styles.note}>Your existing logo stays in place unless you upload a replacement.</p>:null}
  <p className={styles.note}>Shipping regions and availability are vendor-reported and may vary by product, weather, and legal requirements. Only approved profiles appear in the public directory. This is a discovery listing; PodScape does not process vendor sales or guarantee external purchases.</p>
  <button className={styles.submit} type="submit" disabled={pending}>{pending?"Submitting…":draft?"Resubmit for review":"Submit vendor application"}</button>
  {message?<p className={ok?styles.success:styles.error} role={ok?"status":"alert"}>{message}</p>:null}
 </form>;
}
