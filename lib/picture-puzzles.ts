import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";

export type PicturePuzzle={id:string;title:string;description:string;image_path:string;difficulty:"easy"|"medium"|"hard";status:"draft"|"published";created_at:string;};
export const PUZZLE_BUCKET="picture-puzzles";
export const DIFFICULTIES={easy:{label:"Easy",columns:3,rows:3},medium:{label:"Medium",columns:4,rows:4},hard:{label:"Hard",columns:5,rows:5}} as const;
export async function listPicturePuzzles(includeDrafts=false):Promise<PicturePuzzle[]|null>{
 const db=getSupabaseAdmin();if(!db)return null;
 const query=db.from("picture_puzzles").select("id,title,description,image_path,difficulty,status,created_at").order("created_at",{ascending:false});
 const {data,error}=await(includeDrafts?query:query.eq("status","published"));
 if(error){console.error("Picture puzzle list:",error.code);return null;}
 return (data||[]) as PicturePuzzle[];
}
export async function getPicturePuzzle(id:string):Promise<PicturePuzzle|null>{
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const db=getSupabaseAdmin();if(!db)return null;
 const {data,error}=await db.from("picture_puzzles").select("id,title,description,image_path,difficulty,status,created_at").eq("id",id).maybeSingle();
 if(error)return null;return data as PicturePuzzle|null;
}
export function picturePuzzleImage(path:string){
 const db=getSupabaseAdmin();if(!db||!path||path.includes("..")||path.startsWith("/"))return "";
 return db.storage.from(PUZZLE_BUCKET).getPublicUrl(path).data.publicUrl;
}
