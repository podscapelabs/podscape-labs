import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {achievementCatalog} from "@/data/achievement-catalog";

const actions=["onboarding_complete","home_personalized","nav_personalized","species_personalized","manager_personalized"] as const;
type Action=(typeof actions)[number];
const ids=(value:unknown)=>Array.isArray(value)&&value.length>0&&value.length<=24&&
 value.every(x=>typeof x==="string"&&/^[a-z][a-zA-Z0-9-]{0,35}$/.test(x))&&new Set(value).size===value.length;
function validProof(action:Action,proof:unknown):boolean{
 if(!proof||typeof proof!=="object")return false;
 const data=proof as Record<string,unknown>;
 if(action==="onboarding_complete"){
  const steps=data.steps;
  return Array.isArray(steps)&&["welcome,portals,editing,layout","welcome,portals,editing,layout,appearance"].includes(steps.join(","))&&
   ["discover","keep","play","collect","default"].includes(String(data.focus));
 }
 if(action==="nav_personalized"){
  if(!ids(data.ids)||typeof data.area!=="string")return false;
  const arr=data.ids as string[];
  const defaults=data.area==="bottom"?["home","shop","scan","manager","menu"]:
   data.area==="home"?["ledger","shop","fun-zone","community","guides","podbound"]:null;
  return !!defaults&&arr.length===defaults.length&&arr.join("|")!==defaults.join("|")&&
   !arr.includes("owner-tools");
 }
 if(!ids(data.order)||!ids(data.visible))return false;
 const order=data.order as string[],visible=data.visible as string[];
 if(!visible.every(id=>order.includes(id)))return false;
 if(action==="home_personalized"){
  const baseline=["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins","marketNews"];
  const legacy=baseline.filter(id=>id!=="marketNews");
  const defaults=["recent"];
  const known=order.length===baseline.length?baseline:order.length===legacy.length?legacy:null;
  if(!known||!known.every(id=>order.includes(id)))return false;
  return visible.join("|")!==defaults.join("|")||order.join("|")!==known.join("|");
 }
 if(action==="species_personalized"){
  const defaults=["care","moisture","behaviour","habitatAdvanced","about","traits","personal","navigation"];
  return visible.some(id=>!defaults.includes(id))||visible.join("|")!==defaults.join("|")||
   data.changedOrder===true;
 }
 if(action==="manager_personalized"){
  const defaults=["hero","stats","tools","enclosures"];
  return (Array.isArray(data.tools)&&ids(data.tools)&&data.tools.length===6&&data.changed===true)||
   visible.join("|")!==defaults.join("|")||data.changedOrder===true;
 }
 return false;
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>5000)
  return NextResponse.json({error:"Request too large"},{status:413});
 const db=await customerSupabase();
 if(!db)return NextResponse.json({error:"Sign in required"},{status:401});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user?.id||!user.email||!user.email_confirmed_at)
  return NextResponse.json({error:"Verified account required"},{status:401});
 if(user.app_metadata?.role!=="owner"&&(await testerAccessStatus(user.email))!=="approved"&&!(await isAdminAuthenticated()))
  return NextResponse.json({error:"Early Access invitation required"},{status:403});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid payload"},{status:400});
 const {action,proof}=body as Record<string,unknown>;
 if(typeof action!=="string"||!actions.includes(action as Action)||!validProof(action as Action,proof))
  return NextResponse.json({error:"Invalid experience action"},{status:400});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Progress unavailable"},{status:503});
 const {data,error:saveError}=await admin.rpc("record_member_experience_action",{p_user_id:user.id,p_action_key:action});
 if(saveError){console.error("Experience achievement failed",saveError.code);return NextResponse.json({error:"Progress unavailable"},{status:503})}
 const unlocked=(Array.isArray(data)?data:[]).flatMap(row=>{
  const definition=achievementCatalog.find(item=>item.key===row.achievement_key&&item.status==="available");
  return definition?[{id:definition.key,title:definition.title,description:definition.description,exp:definition.exp,coins:0,hidden:definition.hidden===true}]:[];
 });
 return NextResponse.json({saved:true,unlocked});
}
