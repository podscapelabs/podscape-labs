import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {STARTING_BUCKS,arcadeCycleAt,totalValue,isValidPortfolioSnapshot,type Portfolio} from "@/lib/pod-exchange";
import {auditStoredExchangeWallet} from "@/lib/exchange-ranking-audit";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
type Kind="wealth"|"return"|"weekly";
type Participant={id:string;name:string;value:number;profit:number;returnPct:number;weeklyPct:number|null};
type Standing={name:string;value:number;profit:number;returnPct:number;weeklyPct:number|null;position:number;mine:boolean};
const batchSize=150;
const formatPct=(n:number)=>Math.round(n*10000)/10000;
const monday=(time:Date)=>{const d=new Date(Date.UTC(time.getUTCFullYear(),time.getUTCMonth(),time.getUTCDate()));d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);};
async function readAll<T>(fetchPage:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:{code?:string}|null}>):Promise<T[]>{
 const found:T[]=[];for(let from=0;from<5000;from+=1000){
  const {data,error}=await fetchPage(from,from+999);
  if(error)throw new Error("Market rankings storage unavailable");
  found.push(...(data||[]));if(!data||data.length<1000)return found;
 }
 throw new Error("Ranking participation exceeds current leaderboard capacity");
}
function standings(participants:Participant[],kind:Kind,viewerId:string|null){
 const filtered=participants.filter(p=>kind!=="weekly"||p.weeklyPct!==null);
 const metric=(p:Participant)=>kind==="wealth"?p.value:kind==="return"?p.returnPct:p.weeklyPct??-Infinity;
 filtered.sort((a,b)=>metric(b)-metric(a)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 let previous:number|undefined;let rank=0;
 const all=filtered.map((entry,i)=>{
  if(previous===undefined||metric(entry)!==previous){rank=i+1;previous=metric(entry);}
  const {name,value,profit,returnPct,weeklyPct}=entry;
  return {name,value,profit,returnPct,weeklyPct,position:rank,mine:viewerId===entry.id} satisfies Standing;
 });
 return {rows:all.filter(row=>row.position<=50),mine:all.find(row=>row.mine)||null,count:all.length};
}
export async function GET(){
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Market rankings unavailable"},{status:503,headers});
 const client=await customerSupabase();
 const {data:{user}}=client?await client.auth.getUser():{data:{user:null}};
 try{
  const {data:ownWallet,error:ownError}=user?await admin.from("member_exchange_portfolios")
   .select("user_id").eq("user_id",user.id).maybeSingle():{data:null,error:null};
  if(ownError)throw new Error("Unable to verify wallet status");
  const needsWallet=!!user&&!ownWallet;
  // Audit only the signed-in account's legacy wallet once. Public leaderboard
  // requests must never trigger expensive audits for unrelated investors.
  if(user&&ownWallet){
   const existing=await admin.from("member_exchange_ranking_preferences")
    .select("eligible,auto_audit_attempted_at").eq("user_id",user.id).maybeSingle();
   if(existing.error)throw new Error("Market eligibility unavailable");
   if(existing.data&&!existing.data.eligible&&!existing.data.auto_audit_attempted_at){
    const audit=await auditStoredExchangeWallet(user.id);
    const timestamp=new Date().toISOString();
    const result=await admin.from("member_exchange_ranking_preferences")
     .update(audit.ok?{eligible:true,verified_at:timestamp,public_enabled:true,auto_audit_attempted_at:timestamp,updated_at:timestamp}:{auto_audit_attempted_at:timestamp,updated_at:timestamp})
     .eq("user_id",user.id).eq("eligible",false);
    if(result.error)throw new Error("Automatic market verification unavailable");
   }
  }
  // Fresh fetch allows the current viewer's auto-verified wallet to appear immediately.
  const {data:current,error:currentError}=user?await admin.from("member_exchange_ranking_preferences")
    .select("public_enabled,eligible,hide_username,auto_audit_attempted_at").eq("user_id",user.id).maybeSingle():{data:null,error:null};
  if(currentError)throw new Error("Market preferences unavailable");
  const participating=!!ownWallet&&current?.eligible===true&&current.public_enabled!==false;
  const eligible=current?.eligible===true;
  const preferences=await readAll<{user_id:string;hide_username:boolean}>(async (from,to)=>
    await admin.from("member_exchange_ranking_preferences").select("user_id,hide_username")
      .eq("public_enabled",true).eq("eligible",true).order("user_id",{ascending:true}).range(from,to)
  );
  const participants:Participant[]=[];
  const cycle=arcadeCycleAt(Date.now()),weekStart=monday(new Date());
  for(let from=0;from<preferences.length;from+=batchSize){
   const preferenceBatch=preferences.slice(from,from+batchSize);
   const hiddenIds=new Set(preferenceBatch.filter(x=>x.hide_username).map(x=>x.user_id));
   const ids=preferenceBatch.map(x=>x.user_id);
   if(!ids.length)continue;
   const [wallets,profiles,snapshots]=await Promise.all([
    admin.from("member_exchange_portfolios").select("user_id,cash,holdings").in("user_id",ids),
    admin.from("customer_profiles").select("id,display_name").in("id",ids),
    admin.from("member_exchange_weekly_snapshots").select("user_id,baseline_value").eq("week_start",weekStart).in("user_id",ids)
   ]);
   if(wallets.error||profiles.error||snapshots.error)throw new Error("Market ranking records unavailable");
   const names=new Map((profiles.data||[]).map(x=>[x.id,x.display_name]));
   const baselines=new Map((snapshots.data||[]).map(x=>[x.user_id,Number(x.baseline_value)]));
   for(const wallet of wallets.data||[]){
    const portfolio:Portfolio={cash:Number(wallet.cash),holdings:wallet.holdings as Record<string,number>,trades:[]};
    if(!isValidPortfolioSnapshot(portfolio))continue;
    const value=totalValue(portfolio,cycle);
    if(!Number.isFinite(value)||value<0)continue;
    const baseline=baselines.get(wallet.user_id);
    const profit=Math.round((value-STARTING_BUCKS)*100)/100;
    const weeklyPct=baseline!==undefined&&Number.isFinite(baseline)&&baseline>0
     ?formatPct((value-baseline)/baseline*100):null;
    const name=hiddenIds.has(wallet.user_id)?"Anonymous Investor":String(names.get(wallet.user_id)||"PodScape Investor").trim().slice(0,80)||"PodScape Investor";
    participants.push({id:wallet.user_id,name,value,profit,
     returnPct:formatPct(profit/STARTING_BUCKS*100),weeklyPct});
   }
  }
  const viewerId=participating?user?.id||null:null;
  return NextResponse.json({
   signedIn:!!user,participating,hideUsername:current?.hide_username===true,eligible,needsWallet,auditAttempted:!!current?.auto_audit_attempted_at,
   cycle,weekStart,weeklyReady:participants.some(p=>p.weeklyPct!==null),
   wealth:standings(participants,"wealth",viewerId),
   return:standings(participants,"return",viewerId),
   weekly:standings(participants,"weekly",viewerId),
   units:"Duck Bucks",fictional:true
  },{headers});
 }catch(error){
  console.error("Exchange market rankings unavailable",error instanceof Error?error.message:"unknown");
  return NextResponse.json({error:"Market rankings temporarily unavailable"},{status:503,headers});
 }
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>300)return NextResponse.json({error:"Request too large"},{status:413,headers});
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 const client=await customerSupabase();
 if(!client)return NextResponse.json({error:"Sign in required"},{status:401,headers});
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.email_confirmed_at)return NextResponse.json({error:"Verified sign-in required"},{status:401,headers});
 let data:unknown;try{data=await request.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers})}
 if(!data||typeof data!=="object")return NextResponse.json({error:"Invalid request"},{status:400,headers});
 const hideUsername=(data as {hideUsername?:unknown}).hideUsername;
 if(typeof hideUsername!=="boolean")return NextResponse.json({error:"Only username privacy may be updated"},{status:400,headers});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Market ranking unavailable"},{status:503,headers});
 const {data:existing,error:existingError}=await admin.from("member_exchange_ranking_preferences")
  .select("user_id").eq("user_id",user.id).maybeSingle();
 if(existingError)return NextResponse.json({error:"Market ranking privacy unavailable"},{status:503,headers});
 if(!existing)return NextResponse.json({error:"Initialize your market wallet before changing ranking privacy"},{status:409,headers});
 const {error}=await admin.from("member_exchange_ranking_preferences")
  .update({hide_username:hideUsername,updated_at:new Date().toISOString()}).eq("user_id",user.id);
 if(error)return NextResponse.json({error:"Unable to save username privacy"},{status:503,headers});
 return NextResponse.json({saved:true,hideUsername},{headers});
}
