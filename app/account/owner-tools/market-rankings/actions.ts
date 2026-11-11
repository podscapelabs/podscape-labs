"use server";
import {revalidatePath} from "next/cache";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {auditStoredExchangeWallet} from "@/lib/exchange-ranking-audit";

export async function reviewMarketInvestor(formData:FormData){
 if(!(await isAdminAuthenticated()))throw Error("Owner access required");
 const userId=String(formData.get("userId")||"");
 const choice=String(formData.get("decision")||"");
 const note=String(formData.get("note")||"").trim();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)||
  !["approve","decline"].includes(choice)||note.length>500)
  throw Error("Invalid review");
 const admin=getSupabaseAdmin();
 if(!admin)throw Error("Market storage unavailable");
 const {data:request,error:lookupError}=await admin.from("member_exchange_ranking_reviews")
  .select("status").eq("user_id",userId).maybeSingle();
 if(lookupError||request?.status!=="pending")throw Error("Request is no longer pending");
 if(choice==="approve"){
  const audit=await auditStoredExchangeWallet(userId);
  if(!audit.ok)throw Error("Cannot approve: "+audit.reason);
 }
 const {error}=await admin.rpc("review_member_exchange_ranking_request",{
  p_user_id:userId,p_approve:choice==="approve",p_note:note
 });
 if(error){console.error("Market investor review failed",error.code);throw Error("Unable to save investor review")}
 revalidatePath("/account/owner-tools/market-rankings");
}
