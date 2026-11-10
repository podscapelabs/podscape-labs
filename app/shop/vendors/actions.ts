"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {validVendorCountry,vendorShippingModes} from "@/lib/vendor-regions";

type Outcome={success:boolean;message:string};
function clean(value:FormDataEntryValue|null,limit:number){return typeof value==="string"?value.trim().slice(0,limit+1):"";}
function safeUrl(value:string):boolean{
 if(!value)return true;
 if(value.length>500)return false;
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname.includes(".");}catch{return false;}
}
function validImage(bytes:Uint8Array,mime:string){
 const png=bytes.length>8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 const jpg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 return mime==="image/png"&&png?"png":mime==="image/jpeg"&&jpg?"jpg":mime==="image/webp"&&webp?"webp":null;
}
export async function submitVendorProfile(form:FormData):Promise<Outcome>{
 await requireCustomerPreviewAccess();
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 if(!user?.id||!user.email_confirmed_at)return{success:false,message:"Sign in with a verified member account first."};
 const name=clean(form.get("businessName"),80),tagline=clean(form.get("tagline"),140),
 description=clean(form.get("description"),1000),location=clean(form.get("location"),100);
 const website=clean(form.get("website"),500),instagram=clean(form.get("instagram"),500),
 facebook=clean(form.get("facebook"),500);
 const countryCode=clean(form.get("countryCode"),2).toUpperCase();
 const shippingMode=clean(form.get("shippingMode"),30);
 const shippingNotes=clean(form.get("shippingNotes"),400);
 const liveAnimalShipping=clean(form.get("liveAnimalShipping"),10);
 const rawDestinations=clean(form.get("shippingCountries"),1000);
 const shippingCountries=[...new Set(rawDestinations.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean))];
 const validShippingModes=new Set<string>(vendorShippingModes.map(option=>option.value));
 if((countryCode&&!validVendorCountry(countryCode))||!validShippingModes.has(shippingMode)||
  (shippingMode==="domestic"&&!countryCode)||
  !["yes","no","ask"].includes(liveAnimalShipping)||
  shippingNotes.length>400||shippingCountries.length>249||shippingCountries.some(code=>!validVendorCountry(code))||
  (shippingMode==="selected"&&shippingCountries.length===0)||
  (shippingMode!=="selected"&&shippingCountries.length>0))
  return {success:false,message:"Check your country, shipping destinations, and live-animal delivery settings."};
 if(name.length<2||name.length>80||tagline.length>140||description.length>1000||location.length>100
  ||![website,instagram,facebook].every(safeUrl))
  return{success:false,message:"Review your business name, text lengths, and HTTPS links."};
 const admin=getSupabaseAdmin();
 if(!admin)return{success:false,message:"Vendor applications are temporarily unavailable."};
 const {data:existing,error:lookupError}=await admin.from("vendor_profiles").select("id,logo_path,status")
  .eq("user_id",user.id).maybeSingle();
 if(lookupError)return{success:false,message:"Vendor profiles are not configured yet. No changes were saved."};
 let logoPath=String(existing?.logo_path||"");
 const logo=form.get("logo");
 if(logo instanceof File && logo.size){
  if(logo.size>2097152)return{success:false,message:"Logo must be under 2 MB."};
  const bytes=new Uint8Array(await logo.arrayBuffer());
  const extension=validImage(bytes,logo.type);
  if(!extension)return{success:false,message:"Upload a valid PNG, JPG, or WebP logo."};
  const path=user.id+"/"+crypto.randomUUID()+"."+extension;
  const {error:uploadError}=await admin.storage.from("vendor-logos")
   .upload(path,bytes,{contentType:logo.type,upsert:false,cacheControl:"3600"});
  if(uploadError)return{success:false,message:"Logo upload failed. Please try again."};
  logoPath=path;
 }
 const payload={user_id:user.id,business_name:name,tagline,description,location_label:location,
  website_url:website,instagram_url:instagram,facebook_url:facebook,logo_path:logoPath,
  country_code:countryCode,shipping_mode:shippingMode,shipping_countries:shippingCountries,
  shipping_notes:shippingNotes,live_animal_shipping:liveAnimalShipping,
  status:"pending",reviewed_at:null,updated_at:new Date().toISOString()};
 const result=existing
  ? await admin.from("vendor_profiles").update(payload).eq("id",existing.id).eq("user_id",user.id).select("id").single()
  : await admin.from("vendor_profiles").insert(payload).select("id").single();
 if(result.error){
  if(logoPath!==existing?.logo_path&&logoPath)await admin.storage.from("vendor-logos").remove([logoPath]);
  return{success:false,message:"Could not save your application. Please try again."};
 }
 if(existing?.logo_path&&logoPath!==existing.logo_path)
  await admin.storage.from("vendor-logos").remove([existing.logo_path]);
 revalidatePath("/shop/vendors");
 revalidatePath("/shop/vendors/apply");
 revalidatePath("/admin/vendors");
 return{success:true,message:"Application submitted! Your profile is pending owner review."};
}
export async function reviewVendorProfile(form:FormData):Promise<void>{
 if(!(await isAdminAuthenticated()))throw new Error("Owner access required.");
 const id=clean(form.get("id"),50),status=clean(form.get("status"),20);
 if(!/^[a-f0-9-]{36}$/i.test(id)||!["approved","rejected","pending"].includes(status))
  throw new Error("Invalid vendor review.");
 const admin=getSupabaseAdmin();
 if(!admin)throw new Error("Vendor database unavailable.");
 const {error}=await admin.from("vendor_profiles").update({status,reviewed_at:new Date().toISOString(),
  updated_at:new Date().toISOString()}).eq("id",id);
 if(error)throw new Error("Could not update vendor approval.");
 revalidatePath("/admin/vendors");revalidatePath("/shop/vendors");revalidatePath("/shop");
}
