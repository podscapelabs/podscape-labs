import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
export async function GET(){
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Lifetime rankings unavailable"},{status:503,headers});
 const client=await customerSupabase();
 const {data:{user}}=client?await client.auth.getUser():{data:{user:null}};
 const {data:preference,error:prefError}=user?await admin.from("member_exp_ranking_preferences")
  .select("public_enabled,hide_username").eq("user_id",user.id).maybeSingle():{data:null,error:null};
 if(prefError)return NextResponse.json({error:"EXP rankings migration is pending"},{status:503,headers});
 const participating=preference?.public_enabled!==false;
 const {data,error}=await admin.rpc("get_member_exp_rankings",{p_viewer_id:participating?user?.id||null:null});
 if(error){console.error("EXP ranking unavailable",error.code);return NextResponse.json({error:"EXP rankings migration is pending"},{status:503,headers});}
 // Mask names inside the authenticated server route before returning records.
 const users=(Array.isArray(data)?data:[]).map(row=>row.user_id as string);
 const {data:hidden,error:hiddenError}=users.length?
  await admin.from("member_exp_ranking_preferences").select("user_id").in("user_id",users).eq("hide_username",true):
  {data:[],error:null};
 if(hiddenError)return NextResponse.json({error:"EXP ranking privacy unavailable"},{status:503,headers});
 const hiddenSet=new Set((hidden||[]).map(x=>x.user_id));
 const records=(Array.isArray(data)?data:[]).map(row=>({
  name:hiddenSet.has(row.user_id)?"Anonymous Keeper":String(row.display_name||"PodScape Keeper").slice(0,80),
  exp:Number(row.lifetime_exp||0),level:Number(row.keeper_level||1),
  position:Number(row.rank_position||0),mine:participating&&row.user_id===user?.id
 }));
 return NextResponse.json({rows:records.filter(row=>row.position<=50),mine:records.find(row=>row.mine)||null,
  participating,hideUsername:preference?.hide_username===true,signedIn:!!user},{headers});
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>300)return NextResponse.json({error:"Request too large"},{status:413,headers});
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 const client=await customerSupabase();
 if(!client)return NextResponse.json({error:"Sign in required"},{status:401,headers});
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)
  return NextResponse.json({error:"Verified sign-in required"},{status:401,headers});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers})}
 if(!body||typeof body!=="object")
  return NextResponse.json({error:"Invalid preference"},{status:400,headers});
 const input=body as {enabled?:unknown;hideUsername?:unknown};
 if(typeof input.hideUsername==="boolean"&&input.enabled===undefined){
  const admin=getSupabaseAdmin();
  if(!admin)return NextResponse.json({error:"EXP rankings unavailable"},{status:503,headers});
  const {error}=await admin.from("member_exp_ranking_preferences").upsert({
   user_id:user.id,hide_username:input.hideUsername,updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error)return NextResponse.json({error:"Unable to save username privacy"},{status:503,headers});
  return NextResponse.json({saved:true,hideUsername:input.hideUsername},{headers});
 }
 return NextResponse.json({error:"Ranking participation is automatic"},{status:400,headers});
}
