"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getWritableSupabaseAdmin} from "@/lib/supabase-admin";
import {PUZZLE_BUCKET,DIFFICULTIES} from "@/lib/picture-puzzles";

const desk="/admin/puzzle-desk";
export async function createPicturePuzzle(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const title=String(form.get("title")||"").trim().slice(0,90);
 const description=String(form.get("description")||"").trim().slice(0,240);
 const difficulty=String(form.get("difficulty")||"easy");
 const image=form.get("image");
 if(title.length<3||!(difficulty in DIFFICULTIES)||!(image instanceof File)||image.size<100||image.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(image.type))redirect(desk+"?error=invalid");
 const bytes=new Uint8Array(await image.arrayBuffer());
 const signatureOk=image.type==="image/png"?(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71):image.type==="image/jpeg"?(bytes[0]===255&&bytes[1]===216&&bytes[2]===255):(bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70&&String.fromCharCode(...bytes.slice(8,12))==="WEBP");
 if(!signatureOk)redirect(desk+"?error=invalid");
 const db=getWritableSupabaseAdmin();if(!db)redirect(desk+"?error=storage");
 const ext=image.type==="image/png"?"png":image.type==="image/webp"?"webp":"jpg";
 const path="art/"+randomUUID()+"."+ext;
 const {error:uploadError}=await db.storage.from(PUZZLE_BUCKET).upload(path,bytes,{contentType:image.type,upsert:false,cacheControl:"3600"});
 if(uploadError){console.error("Puzzle image upload:",uploadError.message);redirect(desk+"?error=storage");}
 const {error}=await db.from("picture_puzzles").insert({title,description,difficulty,image_path:path,status:"draft"});
 if(error){await db.storage.from(PUZZLE_BUCKET).remove([path]);console.error("Puzzle create:",error.code);redirect(desk+"?error=database");}
 revalidatePath(desk);redirect(desk+"?saved=draft");
}
export async function setPicturePuzzleStatus(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const id=String(form.get("id")||"");const status=String(form.get("status")||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["draft","published"].includes(status))redirect(desk+"?error=invalid");
 const db=getWritableSupabaseAdmin();if(!db)redirect(desk+"?error=storage");
 const {error}=await db.from("picture_puzzles").update({status}).eq("id",id);
 if(error)redirect(desk+"?error=database");
 revalidatePath(desk);revalidatePath("/fun-zone/picture-puzzles");redirect(desk+"?saved="+status);
}
