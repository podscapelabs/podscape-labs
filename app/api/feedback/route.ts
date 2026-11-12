import {NextResponse} from "next/server";
import {customerSupabase} from "@/lib/customer-auth/server";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {isAdminAuthenticated} from "@/lib/admin-auth";

export async function POST(request:Request){
 const db=await customerSupabase();
 if(!db)return NextResponse.json({error:"Sign in to send feedback."},{status:401});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user?.id||!user.email||!user.email_confirmed_at)
  return NextResponse.json({error:"Verify your account to send feedback."},{status:401});
 if(user.app_metadata?.role!=="owner"&&await testerAccessStatus(user.email)!=="approved"&&!await isAdminAuthenticated())
  return NextResponse.json({error:"Early Access approval required."},{status:403});
 if(Number(request.headers.get("content-length")||0)>6500)
  return NextResponse.json({error:"Feedback is too long."},{status:413});
 let payload:unknown;
 try{payload=await request.json()}catch{return NextResponse.json({error:"Invalid feedback."},{status:400})}
 if(!payload||typeof payload!=="object")return NextResponse.json({error:"Invalid feedback."},{status:400});
 const input=payload as Record<string,unknown>;
 const category=input.category;
 const message=typeof input.message==="string"?input.message.trim():"";
 const page=typeof input.page==="string"?input.page.slice(0,300):"";
 const device=typeof input.device==="string"?input.device.slice(0,250):"";
 if(!["bug","idea","general"].includes(String(category))||message.length<10||message.length>2000||!page.startsWith("/")||page.startsWith("//"))
  return NextResponse.json({error:"Choose a category and write at least 10 characters."},{status:400});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Feedback is unavailable right now."},{status:503});
 // Small per-account rate limit to prevent accidental duplicates and spam.
 const since=new Date(Date.now()-60*60*1000).toISOString();
 const {count,error:countError}=await admin.from("member_feedback").select("id",{count:"exact",head:true})
  .eq("user_id",user.id).gte("created_at",since);
 if(countError)return NextResponse.json({error:"Feedback is unavailable right now."},{status:503});
 if((count||0)>=5)return NextResponse.json({error:"You've sent several reports recently. Try again later."},{status:429});
 const {error}=await admin.from("member_feedback").insert({
  user_id:user.id,category,message,page_path:page,device_info:device,status:"new"
 });
 if(error){console.error("Feedback submission:",error.code);return NextResponse.json({error:"Could not send feedback. Please try again."},{status:503})}
 return NextResponse.json({saved:true},{status:201});
}
