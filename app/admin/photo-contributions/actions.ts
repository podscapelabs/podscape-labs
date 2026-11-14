"use server";
import {revalidatePath} from "next/cache";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

export async function reviewMemberPhoto(form:FormData){
 if(!(await isAdminAuthenticated()))return {success:false,error:"Owner access required."};
 const id=String(form.get("id")||"");
 const choice=String(form.get("choice")||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(choice))return {success:false,error:"Invalid review."};
 const db=getSupabaseAdmin();
 if(!db)return {success:false,error:"Storage unavailable."};
 const {data,error}=await db.from("member_species_photos").update({
  moderation_status:choice,reviewed_at:new Date().toISOString(),moderator_note:String(form.get("note")||"").slice(0,300),
 }).eq("id",id).eq("moderation_status","pending").eq("contribution_consent",true).select("species_id").maybeSingle();
 if(error||!data)return {success:false,error:"Photo was already reviewed or could not be updated."};
 revalidatePath("/admin/photo-contributions");
 revalidatePath("/ledger","layout");
 return {success:true};
}
