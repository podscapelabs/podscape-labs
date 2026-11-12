"use server";
import {revalidatePath} from "next/cache";
import {customerSupabase} from "@/lib/customer-auth/server";
import {requireCustomerPreviewAccess} from "@/lib/customer-auth/access";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {isAdminAuthenticated} from "@/lib/admin-auth";

export async function submitSpeciesRequest(name:string){
 await requireCustomerPreviewAccess();
 if(typeof name!=="string"||name.trim().length<2||name.trim().length>120)return{error:"Enter a species name between 2 and 120 characters."};
 const db=await customerSupabase();const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 if(!user?.email_confirmed_at)return{error:"Sign in with a verified account to request a species."};
 const admin=getSupabaseAdmin();if(!admin)return{error:"Requests are temporarily unavailable."};
 const {error}=await admin.rpc("submit_species_request",{p_user_id:user.id,p_name:name.trim()});
 if(error)return{error:error.message.includes("Daily species request limit")?"You can request up to five species per day. Please try again tomorrow.":"Could not send your request. Please try again."};
 revalidatePath("/account/owner-tools/species-requests");return{success:true};
}
export async function markSpeciesRequestHandled(form:FormData){
 if(!(await isAdminAuthenticated()))throw new Error("Owner access required");
 const id=String(form.get("id")||""),handled=form.get("handled")==="true";
 if(!/^[a-f0-9-]{36}$/i.test(id))throw new Error("Invalid request");
 const admin=getSupabaseAdmin();if(!admin)throw new Error("Requests unavailable");
 const {error}=await admin.from("species_requests").update({handled}).eq("id",id);
 if(error)throw new Error("Could not update request");
 revalidatePath("/account/owner-tools/species-requests");
}
