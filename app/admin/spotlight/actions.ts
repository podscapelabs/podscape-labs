"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getWritableSupabaseAdmin } from "@/lib/supabase-admin";
import { getSpotlightOptions } from "@/lib/podscape-spotlights";

export async function saveSpotlightSelection(form:FormData) {
  if(!(await isAdminAuthenticated()))redirect("/admin");
  const options=await getSpotlightOptions();
  const allowed=new Set(options.map(o=>o.href));
  const values=Array.from({length:5},(_,i)=>String(form.get("slot"+(i+1))||"").trim()).filter(Boolean);
  if(values.some(v=>!allowed.has(v))||new Set(values).size!==values.length)
    redirect("/admin/spotlight?error=selection");
  const db=getWritableSupabaseAdmin();
  if(!db)redirect("/admin/spotlight?error=storage");
  // A single transaction isn't provided by the JS API; stage the new
  // ordered rows before removing slots that are no longer selected.
  const rows=values.map((href,i)=>({slot:i+1,href,updated_at:new Date().toISOString()}));
  if(rows.length){
    const {error}=await db.from("podscape_spotlights").upsert(rows,{onConflict:"slot"});
    if(error)redirect("/admin/spotlight?error=storage");
  }
  const {error:removeError}=await db.from("podscape_spotlights").delete().gt("slot",values.length);
  if(removeError)redirect("/admin/spotlight?error=storage");
  revalidatePath("/app");
  revalidatePath("/admin/spotlight");
  redirect("/admin/spotlight?saved=1");
}
