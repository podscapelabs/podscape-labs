"use server";
import {revalidatePath} from "next/cache";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {validVendorCountry,vendorShippingModes} from "@/lib/vendor-regions";
type Result={success:boolean;message:string};
const value=(form:FormData,key:string,max:number)=>{const v=form.get(key);return typeof v==="string"?v.trim().slice(0,max+1):""};
const safeUrl=(url:string)=>{if(!url)return true;try{const p=new URL(url);return p.protocol==="https:"&&!p.username&&!p.password&&p.hostname.includes(".")&&url.length<=500;}catch{return false}};
const uuid=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
export async function saveOwnerVendor(form:FormData):Promise<Result>{
 if(!(await isAdminAuthenticated()))return{success:false,message:"Owner session required."};
 const id=value(form,"id",40),expected=value(form,"expectedUpdatedAt",80);
 const name=value(form,"businessName",80),tagline=value(form,"tagline",140),description=value(form,"description",1000),location=value(form,"location",100);
 const country=value(form,"countryCode",2).toUpperCase(),mode=value(form,"shippingMode",30);
 const countries=[...new Set(value(form,"shippingCountries",1000).split(",").map(x=>x.trim().toUpperCase()).filter(Boolean))];
 const shippingNotes=value(form,"shippingNotes",400),live=value(form,"liveAnimalShipping",10),status=value(form,"status",20);
 const website=value(form,"website",500),instagram=value(form,"instagram",500),facebook=value(form,"facebook",500);
 if((id&&!uuid.test(id))||name.length<2||name.length>80||tagline.length>140||description.length>1000||location.length>100||shippingNotes.length>400||
  (country&&!validVendorCountry(country))||!vendorShippingModes.some(m=>m.value===mode)||!["yes","no","ask"].includes(live)||!["pending","approved"].includes(status)||
  (mode==="domestic"&&!country)||(mode==="selected"&&!countries.length)||countries.length>249||countries.some(x=>!validVendorCountry(x))||
  (mode!=="selected"&&countries.length>0)||![website,instagram,facebook].every(safeUrl))
  return {success:false,message:"Check the business name, HTTPS links, shipping coverage and field lengths."};
 const db=getSupabaseAdmin();
 if(!db)return {success:false,message:"Vendor database is unavailable. Nothing was saved."};
 const payload={business_name:name,tagline,description,location_label:location,country_code:country,
  shipping_mode:mode,shipping_countries:countries,shipping_notes:shippingNotes,live_animal_shipping:live,
  website_url:website,instagram_url:instagram,facebook_url:facebook,status,updated_at:new Date().toISOString(),
  reviewed_at:status==="approved"?new Date().toISOString():null};
 if(id){
  if(!expected||!Number.isFinite(Date.parse(expected)))return{success:false,message:"Refresh this listing before editing."};
  const {data,error}=await db.from("vendor_profiles").update(payload).eq("id",id).is("user_id",null).eq("updated_at",expected).select("id").maybeSingle();
  if(error)return{success:false,message:"Could not update the listing. Check that the database migration is applied."};
  if(!data)return{success:false,message:"This listing has changed or is not owner-managed. Refresh and try again."};
 }else{
  const {error}=await db.from("vendor_profiles").insert({...payload,user_id:null,logo_path:""});
  if(error)return{success:false,message:"Could not create this listing. Apply the owner-managed vendor database migration first."};
 }
 revalidatePath("/admin/vendors");revalidatePath("/shop/vendors");revalidatePath("/shop");
 return{success:true,message:status==="approved"?"Vendor saved and published to the directory.":"Vendor saved as an unpublished draft."};
}
