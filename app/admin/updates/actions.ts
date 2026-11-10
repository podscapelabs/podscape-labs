"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getWritableSupabaseAdmin} from "@/lib/supabase-admin";
import {updateCategories,validDestination,type UpdateCategory} from "@/lib/podscape-updates";

const allowed=new Set<string>(updateCategories.map(x=>x.id));
function value(form:FormData,key:string){const raw=form.get(key);return typeof raw==="string"?raw.trim():"";}
function refresh(){revalidatePath("/app");revalidatePath("/");revalidatePath("/updates");revalidatePath("/admin/updates");}

export async function savePlatformUpdate(form:FormData){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const id=value(form,"id"),category=value(form,"category"),title=value(form,"title"),
  summary=value(form,"summary"),href=value(form,"href"),intent=value(form,"intent");
 const detailText=value(form,"details");
 const details=detailText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(!allowed.has(category)||title.length<3||title.length>100||summary.length<5||summary.length>240
  ||details.length>12||(intent==="publish"&&details.length===0)||details.some(line=>line.length>220)||detailText.length>3000
  ||!validDestination(href)||!["draft","publish"].includes(intent)||Boolean(id&&!/^[\da-f-]{36}$/i.test(id)))
  redirect("/admin/updates?error=validation");
 const db=getWritableSupabaseAdmin();
 if(!db)redirect("/admin/updates?error=storage");
 const now=new Date().toISOString();
 const payload={category:category as UpdateCategory,title,summary,details,href,updated_at:now};
 let error:unknown=null;
 if(id){
  const existing=await db.from("podscape_updates").select("id,status,published_at").eq("id",id).maybeSingle();
  if(existing.error||!existing.data)redirect("/admin/updates?error=missing");
  const isPublishing=intent==="publish";
  const update={...payload,status:isPublishing?"published":"draft",published_at:isPublishing?(existing.data.status==="published"?existing.data.published_at:now):null};
  ({error}=await db.from("podscape_updates").update(update).eq("id",id));
 }else{
  const isPublishing=intent==="publish";
  ({error}=await db.from("podscape_updates").insert({...payload,status:isPublishing?"published":"draft",published_at:isPublishing?now:null}));
 }
 if(error)redirect("/admin/updates?error=storage");
 refresh();redirect("/admin/updates?saved=1");
}
export async function changePlatformUpdateStatus(form:FormData){
 if(!(await isAdminAuthenticated()))redirect("/admin");
 const id=value(form,"id"),status=value(form,"status");
 if(!/^[\da-f-]{36}$/i.test(id)||!["draft","published"].includes(status))redirect("/admin/updates?error=validation");
 const db=getWritableSupabaseAdmin();
 if(!db)redirect("/admin/updates?error=storage");
 const current=await db.from("podscape_updates").select("status,published_at,details").eq("id",id).maybeSingle();
 if(current.error||!current.data)redirect("/admin/updates?error=missing");
 if(status==="published"&&(!Array.isArray(current.data.details)||current.data.details.length===0))redirect("/admin/updates?error=details");
 const publishedAt=status==="published"?(current.data.status==="published"?current.data.published_at:new Date().toISOString()):null;
 const {error}=await db.from("podscape_updates").update({status,published_at:publishedAt,updated_at:new Date().toISOString()}).eq("id",id);
 if(error)redirect("/admin/updates?error=storage");
 refresh();redirect("/admin/updates?saved=1");
}
