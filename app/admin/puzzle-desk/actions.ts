"use server";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {getWritableSupabaseAdmin} from "@/lib/supabase-admin";
import {PUZZLE_BUCKET,DIFFICULTIES,PUZZLE_TYPES} from "@/lib/picture-puzzles";

const desk="/admin/puzzle-desk";
function fields(form:FormData){
 const title=String(form.get("title")||"").trim();
 const description=String(form.get("description")||"").trim();
 const image_alt=String(form.get("image_alt")||"").trim();
 const learning_note=String(form.get("learning_note")||"").trim();
 const puzzle_type=String(form.get("puzzle_type")||"jigsaw");
 const difficulty=String(form.get("difficulty")||"easy");
 const level=Number(form.get("level")||1);
 if(title.length<3||title.length>90||description.length>240||image_alt.length<3||image_alt.length>180||learning_note.length>300||!(puzzle_type in PUZZLE_TYPES)||!(difficulty in DIFFICULTIES)||!Number.isInteger(level)||level<1||level>20)return null;
 return {title,description,image_alt,learning_note,puzzle_type,difficulty,level};
}
function refresh(id?:string){revalidatePath(desk);revalidatePath("/fun-zone/picture-puzzles");if(id)revalidatePath("/fun-zone/picture-puzzles/"+id);}
export async function createPicturePuzzle(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const payload=fields(form),image=form.get("image");
 if(!payload||!(image instanceof File)||image.size<100||image.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(image.type))redirect(desk+"?error=invalid");
 const bytes=new Uint8Array(await image.arrayBuffer());
 const signatureOk=image.type==="image/png"?(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71):image.type==="image/jpeg"?(bytes[0]===255&&bytes[1]===216&&bytes[2]===255):(bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70&&String.fromCharCode(...bytes.slice(8,12))==="WEBP");
 if(!signatureOk)redirect(desk+"?error=invalid");
 const db=getWritableSupabaseAdmin();if(!db)redirect(desk+"?error=storage");
 const ext=image.type==="image/png"?"png":image.type==="image/webp"?"webp":"jpg";
 const path="art/"+randomUUID()+"."+ext;
 const {error:uploadError}=await db.storage.from(PUZZLE_BUCKET).upload(path,bytes,{contentType:image.type,upsert:false,cacheControl:"3600"});
 if(uploadError){console.error("Puzzle image upload:",uploadError.message);redirect(desk+"?error=storage");}
 const {error}=await db.from("picture_puzzles").insert({...payload,image_path:path,status:"draft"});
 if(error){await db.storage.from(PUZZLE_BUCKET).remove([path]);console.error("Puzzle create:",error.code);redirect(desk+"?error=database");}
 refresh();redirect(desk+"?saved=draft");
}
export async function updatePicturePuzzle(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const id=String(form.get("id")||"");
 const payload=fields(form);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!payload)redirect(desk+"?error=invalid");
 const db=getWritableSupabaseAdmin();if(!db)redirect(desk+"?error=storage");
 const {error}=await db.from("picture_puzzles").update(payload).eq("id",id);
 if(error)redirect(desk+"?error=database");
 refresh(id);redirect(desk+"?saved=updated");
}
export async function setPicturePuzzleStatus(form:FormData){
 if(!await isAdminAuthenticated())redirect("/admin");
 const id=String(form.get("id")||""),status=String(form.get("status")||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["draft","published"].includes(status))redirect(desk+"?error=invalid");
 const db=getWritableSupabaseAdmin();if(!db)redirect(desk+"?error=storage");
 const {error}=await db.from("picture_puzzles").update({status}).eq("id",id);
 if(error)redirect(desk+"?error=database");
 refresh(id);redirect(desk+"?saved="+status);
}
