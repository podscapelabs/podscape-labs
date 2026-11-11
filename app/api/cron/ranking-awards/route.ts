import {NextResponse} from "next/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret)return NextResponse.json({error:"Ranking settlement is not configured"},{status:503});
 if(request.headers.get("authorization")!==`Bearer ${secret}`)
  return NextResponse.json({error:"Unauthorized"},{status:401});
 const db=getSupabaseAdmin();
 if(!db)return NextResponse.json({error:"Rankings database is unavailable"},{status:503});
 const {data,error}=await db.rpc("settle_fun_zone_rankings");
 if(error){console.error("Ranking settlement failed",error.code);return NextResponse.json({error:"Ranking settlement failed"},{status:503});}
 return NextResponse.json({success:true,newAwards:Number(data||0)},{headers:{"Cache-Control":"no-store"}});
}
