import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {STARTING_BUCKS,cycleAt,totalValue,isValidPortfolioSnapshot,type Portfolio} from "@/lib/pod-exchange";

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
  const {data:preference,error:prefError}=user?await admin.from("member_exchange_ranking_preferences")
   .select("public_enabled,eligible").eq("user_id",user.id).maybeSingle():{data:null,error:null};
  if(prefError)throw new Error("Ranking preferences unavailable");
  const participating=preference?.public_enabled===true&&preference.eligible===true;
  const eligible=preference?.eligible===true;
  const preferences=await readAll<{user_id:string}>(async (from,to)=>
    await admin.from("member_exchange_ranking_preferences").select("user_id")
      .eq("public_enabled",true).eq("eligible",true).order("user_id",{ascending:true}).range(from,to)
  );
  const participants:Participant[]=[];
  const cycle=cycleAt(Date.now()),weekStart=monday(new Date());
  for(let from=0;from<preferences.length;from+=batchSize){
   const ids=preferences.slice(from,from+batchSize).map(x=>x.user_id);
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
    const name=String(names.get(wallet.user_id)||"PodScape Investor").trim().slice(0,80)||"PodScape Investor";
    participants.push({id:wallet.user_id,name,value,profit,
     returnPct:formatPct(profit/STARTING_BUCKS*100),weeklyPct});
   }
  }
  const viewerId=participating?user?.id||null:null;
  return NextResponse.json({
   signedIn:!!user,participating,eligible,legacyReviewRequired:!!user&&!eligible,
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
 if(!data||typeof data!=="object"||typeof (data as {enabled?:unknown}).enabled!=="boolean")
  return NextResponse.json({error:"Invalid preference"},{status:400,headers});
 const enabled=(data as {enabled:boolean}).enabled;
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Market ranking unavailable"},{status:503,headers});
 const {data:record,error}=await admin.from("member_exchange_ranking_preferences")
  .select("eligible").eq("user_id",user.id).maybeSingle();
 if(error)return NextResponse.json({error:"Market rankings migration pending"},{status:503,headers});
 if(enabled&&!record?.eligible)return NextResponse.json({
  error:"This wallet's starting balance needs verification before it can join public market rankings. Your Duck Bucks and shares are safe."
 },{status:403,headers});
 if(!record)return NextResponse.json({saved:true,participating:false},{headers});
 const {error:updateError}=await admin.from("member_exchange_ranking_preferences")
  .update({public_enabled:enabled,updated_at:new Date().toISOString()}).eq("user_id",user.id);
 if(updateError)return NextResponse.json({error:"Could not save ranking preference"},{status:503,headers});
 return NextResponse.json({saved:true,participating:enabled},{headers});
}
