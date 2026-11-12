"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

const desk="/admin/feedback";
export async function updateFeedbackStatus(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const id=String(form.get("id")||"");
 const status=String(form.get("status")||"");
 const owner_note=String(form.get("owner_note")||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["new","reviewing","resolved"].includes(status)||owner_note.length>1000)
  redirect(desk+"?notice=invalid");
 const db=getSupabaseAdmin();
 if(!db)redirect(desk+"?notice=unavailable");
 const {data,error}=await db.from("member_feedback")
  .update({status,owner_note,updated_at:new Date().toISOString()}).eq("id",id).select("id").maybeSingle();
 if(error||!data)redirect(desk+"?notice=unavailable");
 revalidatePath(desk);
 redirect(desk+"?notice=updated");
}
