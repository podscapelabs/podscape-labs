import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSpeciesRecords } from "@/lib/species-store";

export const runtime = "nodejs";
const BUCKET = "member-species-photos";
const MAX = 5 * 1024 * 1024;
function failure(message:string,status=400){return NextResponse.json({error:message},{status});}
function sameOrigin(request:NextRequest){
  const origin=request.headers.get("origin");
  if(!origin)return false;
  try{return new URL(origin).host === request.headers.get("host");}catch{return false;}
}
async function who(){
  const client=await customerSupabase();
  if(!client)return null;
  const {data:{user}}=await client.auth.getUser();
  return user;
}
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return failure("Untrusted upload origin.",403);
  const user=await who(),admin=getSupabaseAdmin();
  if(!user)return failure("Sign in to add photos.",401);
  if(!admin)return failure("Photo storage is unavailable.",503);
  const form=await request.formData().catch(()=>null);
  if(!form)return failure("Invalid upload.");
  const speciesId=String(form.get("speciesId")||"");
  const enclosureId=String(form.get("enclosureId")||"");
  const contributed=form.get("contribute")==="true";
  const creditType=form.get("creditType")==="anonymous"?"anonymous":"username";
  const file=form.get("file");
  if(!(file instanceof File))return failure("Choose a photo.");
  // Browsers such as iOS Safari may not support canvas WebP export. JPEG is a safe fallback.
  const allowed=file.type==="image/webp"||file.type==="image/jpeg";
  if(file.size<100||file.size>MAX||!allowed)return failure("Please upload an optimized JPEG or WebP photo under 5 MB.");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const isWebp=bytes.length>12&&new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
  const isJpeg=bytes.length>4&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[bytes.length-2]===0xff&&bytes[bytes.length-1]===0xd9;
  if((file.type==="image/webp"&&!isWebp)||(file.type==="image/jpeg"&&!isJpeg))return failure("Invalid image format.");
  const species=(await getSpeciesRecords()).find(record=>record.id===speciesId&&record.kind==="species"&&record.status==="published");
  if(!species)return failure("Choose a published Leaf Ledger species.");
  if(enclosureId){
    const {data:bin,error}=await admin.from("keeper_enclosures").select("id").eq("id",enclosureId).eq("user_id",user.id).eq("species_id",speciesId).maybeSingle();
    if(error||!bin)return failure("The selected bin is not yours.",403);
  }
  const {count,error:countError}=await admin.from("member_species_photos").select("id",{count:"exact",head:true}).eq("user_id",user.id);
  if(countError)return failure("Photo records are not ready. Please contact the owner.",503);
  if((count??0)>=25)return failure("Your 25-photo beta allowance is full.");
  const {data:profile}=await admin.from("customer_profiles").select("display_name").eq("id",user.id).maybeSingle();
  const creditName=creditType==="anonymous"?"":String(profile?.display_name||"PodScape Keeper").slice(0,80);
  const mime=file.type,extension=mime==="image/webp"?"webp":"jpg";
  const id=randomUUID(),path=user.id+"/"+id+"."+extension;
  const {error:uploadError}=await admin.storage.from(BUCKET).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"3600"});
  if(uploadError)return failure("Could not store photo. Try again.",503);
  const {error:dbError}=await admin.from("member_species_photos").insert({
    id,user_id:user.id,species_id:speciesId,enclosure_id:enclosureId||null,storage_path:path,
    original_name:"species-photo."+extension,mime_type:mime,byte_size:bytes.length,
    credit_type:creditType,credit_name:creditName,contribution_consent:contributed,
    moderation_status:contributed?"pending":"private",
  });
  if(dbError){
    await admin.storage.from(BUCKET).remove([path]);
    return failure("Unable to save photo details. No photo was added.",503);
  }
  return NextResponse.json({success:true,id,status:contributed?"pending":"private"},{status:201});
}
export async function DELETE(request:NextRequest){
  if(!sameOrigin(request))return failure("Untrusted request.",403);
  const user=await who(),admin=getSupabaseAdmin();
  if(!user)return failure("Sign in.",401);
  if(!admin)return failure("Storage unavailable.",503);
  const id=String((await request.json().catch(()=>({})))?.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return failure("Invalid photo ID.");
  const {data:photo}=await admin.from("member_species_photos").select("storage_path").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(!photo)return failure("Photo not found.",404);
  // Hide immediately before deleting bytes; a failed storage delete will be retried by cleanup.
  const {error}=await admin.from("member_species_photos").delete().eq("id",id).eq("user_id",user.id);
  if(error)return failure("Couldn't remove photo.",503);
  await admin.storage.from(BUCKET).remove([photo.storage_path]);
  return NextResponse.json({success:true});
}
