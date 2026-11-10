import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {parseUiPreferences} from "@/lib/ui-preferences";

export const dynamic = "force-dynamic";

async function authorize() {
 const db=await customerSupabase();
 if(!db)return null;
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user?.id||!user.email||!user.email_confirmed_at)return null;
 const owner=user.app_metadata?.role==="owner"||await isAdminAuthenticated();
 if(!owner&&(await testerAccessStatus(user.email))!=="approved")return null;
 return {db,userId:user.id,owner};
}
const columns="revision,home_layout,home_nav,bottom_nav,manager_layout,species_layout,updated_at";
function response(data:{revision:number;home_layout:unknown;home_nav:unknown;bottom_nav:unknown;manager_layout:unknown;species_layout:unknown;updated_at:string}|null){
 return NextResponse.json({
  revision:data?.revision??0,
  preferences:data?{home:data.home_layout,navHome:data.home_nav,navBottom:data.bottom_nav,manager:data.manager_layout,species:data.species_layout}:null,
  updatedAt:data?.updated_at??null
 },{headers:{"Cache-Control":"no-store"}});
}
export async function GET(){
 const session=await authorize();
 if(!session)return NextResponse.json({error:"Verified member required"},{status:401,headers:{"Cache-Control":"no-store"}});
 const {data,error}=await session.db.from("member_ui_preferences").select(columns).eq("user_id",session.userId).maybeSingle();
 if(error)return NextResponse.json({error:"Preferences unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 return response(data);
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>14000)
  return NextResponse.json({error:"Payload too large"},{status:413});
 const session=await authorize();
 if(!session)return NextResponse.json({error:"Verified member required"},{status:401});
 let input:unknown;
 try{input=await request.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!input||typeof input!=="object")return NextResponse.json({error:"Invalid payload"},{status:400});
 const {revision,preferences} = input as Record<string,unknown>;
 if(typeof revision!=="number"||!Number.isSafeInteger(revision)||revision<0||revision>Number.MAX_SAFE_INTEGER-1)
  return NextResponse.json({error:"Invalid revision"},{status:400});
 const parsed=parseUiPreferences(preferences,session.owner);
 if(!parsed)return NextResponse.json({error:"Invalid preference values"},{status:400});
 const fields={
  home_layout:parsed.home,home_nav:parsed.navHome,bottom_nav:parsed.navBottom,
  manager_layout:parsed.manager,species_layout:parsed.species,
  updated_at:new Date().toISOString()
 };
 const query=session.db.from("member_ui_preferences");
 if(revision===0){
  const {data,error}=await query.insert({user_id:session.userId,revision:1,...fields}).select(columns).maybeSingle();
  if(error?.code==="23505")return NextResponse.json({error:"Another device saved preferences first",conflict:true},{status:409});
  if(error||!data)return NextResponse.json({error:"Preferences could not be saved"},{status:503});
  return response(data);
 }
 const {data,error}=await query.update({...fields,revision:revision+1}).eq("user_id",session.userId).eq("revision",revision).select(columns).maybeSingle();
 if(error)return NextResponse.json({error:"Preferences could not be saved"},{status:503});
 if(!data)return NextResponse.json({error:"Preferences changed on another device",conflict:true},{status:409});
 return response(data);
}
