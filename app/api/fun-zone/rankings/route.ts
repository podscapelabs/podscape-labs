import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {ARCADE_GAMES} from "@/lib/fun-zone-arcade";
export const dynamic="force-dynamic";
const periods=["daily","weekly","monthly","all-time"] as const;
const validGames=new Set(["all",...ARCADE_GAMES.filter(game=>game.key!=="pod-exchange").map(game=>game.key)]);
const noStore={"Cache-Control":"private, no-store, max-age=0"};
export async function GET(request:Request){
 const url=new URL(request.url);
 const period=url.searchParams.get("period")||"weekly";
 const game=url.searchParams.get("game")||"all";
 if(!periods.some(x=>x===period)||!validGames.has(game))
  return NextResponse.json({error:"Invalid ranking filters"},{status:400,headers:noStore});
 const db=getSupabaseAdmin();
 if(!db)return NextResponse.json({error:"Rankings are temporarily unavailable"},{status:503,headers:noStore});
 const client=await customerSupabase();
 const {data:{user}}=client?await client.auth.getUser():{data:{user:null}};
 const {data:preference,error:preferenceError}=user?await db.from("fun_zone_ranking_preferences").select("public_enabled,hide_username").eq("user_id",user.id).maybeSingle():{data:null,error:null};
 if(preferenceError)return NextResponse.json({error:"Rankings database update is pending"},{status:503,headers:noStore});
 const enabled=preference?.public_enabled===true;
 const {data,error}=await db.rpc("get_fun_zone_rankings",{
  p_period:period,p_game_key:game,p_viewer_id:enabled?user?.id||null:null
 });
 if(error){console.error("Rankings unavailable",error.code);return NextResponse.json({error:"Rankings database update is pending"},{status:503,headers:noStore});}
 const {data:awardData,error:awardError}=user?await db.from("fun_zone_ranking_awards")
  .select("board_key,period_key,period_start,placement,exp_awarded,awarded_at")
  .eq("user_id",user.id).order("awarded_at",{ascending:false}).limit(8):{data:[],error:null};
 if(awardError)return NextResponse.json({error:"Ranking rewards are temporarily unavailable"},{status:503,headers:noStore});
 const awards=(awardData||[]).map(entry=>({board:String(entry.board_key),period:String(entry.period_key),
  place:Number(entry.placement),exp:Number(entry.exp_awarded),date:String(entry.awarded_at)}));
 // Resolve public-name privacy on the server before serializing any rankings.
 const rankedUsers=(Array.isArray(data)?data:[]).map(row=>row.user_id as string);
 const {data:hiddenUsers,error:hiddenError}=rankedUsers.length?
  await db.from("fun_zone_ranking_preferences").select("user_id").in("user_id",rankedUsers).eq("hide_username",true):
  {data:[],error:null};
 if(hiddenError)return NextResponse.json({error:"Ranking privacy settings unavailable"},{status:503,headers:noStore});
 const hiddenSet=new Set((hiddenUsers||[]).map(p=>p.user_id));
 const rows=(Array.isArray(data)?data:[]).map(row=>({
  name:hiddenSet.has(row.user_id)?"Anonymous Keeper":String(row.display_name||"PodScape Keeper").slice(0,80),
  points:Number(row.ranking_points||0),completions:Number(row.completed_count||0),
  position:Number(row.rank_position||0),mine:enabled&&row.user_id===user?.id
 }));
 return NextResponse.json({period,game,rows:rows.filter(row=>row.position<=50),mine:rows.find(row=>row.mine)||null,participating:enabled,hideUsername:preference?.hide_username===true,signedIn:!!user,timezone:"UTC",awards},{headers:noStore});
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>300)return NextResponse.json({error:"Request too large"},{status:413});
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const client=await customerSupabase();
 if(!client)return NextResponse.json({error:"Sign in required"},{status:401});
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)return NextResponse.json({error:"Verified sign-in required"},{status:401});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 if(!body||typeof body!=="object")
  return NextResponse.json({error:"Invalid preference"},{status:400});
 const input=body as {enabled?:unknown;hideUsername?:unknown};
 if(typeof input.hideUsername==="boolean"&&input.enabled===undefined){
  const db=getSupabaseAdmin();
  if(!db)return NextResponse.json({error:"Rankings unavailable"},{status:503,headers:noStore});
  const {error}=await db.from("fun_zone_ranking_preferences").upsert({
   user_id:user.id,hide_username:input.hideUsername,updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error)return NextResponse.json({error:"Unable to save username privacy"},{status:503,headers:noStore});
  return NextResponse.json({saved:true,hideUsername:input.hideUsername},{headers:noStore});
 }
 if(typeof input.enabled!=="boolean")return NextResponse.json({error:"Invalid preference"},{status:400,headers:noStore});
 const enabled=(body as {enabled:boolean}).enabled;
 const db=getSupabaseAdmin();
 if(!db)return NextResponse.json({error:"Rankings are unavailable"},{status:503});
 const {error}=await db.from("fun_zone_ranking_preferences").upsert({user_id:user.id,public_enabled:enabled,reward_opted_in_at:enabled?new Date().toISOString():null,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error){console.error("Ranking preference error",error.code);return NextResponse.json({error:"Unable to save your preference"},{status:503});}
 return NextResponse.json({saved:true,participating:enabled},{headers:noStore});
}
