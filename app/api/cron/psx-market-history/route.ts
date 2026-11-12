import {NextResponse} from "next/server";
import {catchUpPublishedPsxV3History} from "@/lib/psx-v3-history-server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
/** Daily authenticated safety net. Market prices do not depend on cron success. */
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!=="Bearer "+secret)
  return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const result=await catchUpPublishedPsxV3History(Date.now(),180);
  return NextResponse.json({ok:true,...result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("PSX daily history catch-up failed",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"History catch-up incomplete; prices remain authoritative"},{status:503});
 }
}
