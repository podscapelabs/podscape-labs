import {NextRequest,NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getPsxV3Preview,isPsxRange} from "@/lib/psx-v3-preview-server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0"};
/**
 * Only for owner QA. Does not replace /api/fun-zone/pod-exchange or authorize trades.
 * Disabled by default; requires explicit PSX_V3_PREVIEW_ENABLED=true, a staged
 * testing version, private seed and matching fingerprint.
 */
export async function GET(request:NextRequest){
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const owner=user?.app_metadata?.role==="owner"||await isAdminAuthenticated();
 if(!owner)return NextResponse.json({error:"Owner access required"},{status:403,headers});
 const range=request.nextUrl.searchParams.get("range")||"30m";
 if(!isPsxRange(range))return NextResponse.json({error:"Invalid chart range"},{status:400,headers});
 try{
  const result=await getPsxV3Preview(range);
  if(!result.available)return NextResponse.json({available:false,reason:result.reason},{headers});
  return NextResponse.json(result,{headers});
 }catch(error){
  console.error("Private PSX preview unavailable",error instanceof Error?error.name:"unknown");
  return NextResponse.json({error:"Market preview unavailable; no user data was changed"},{status:503,headers});
 }
}
