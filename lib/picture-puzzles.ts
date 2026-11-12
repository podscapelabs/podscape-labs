import "server-only";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {DIFFICULTIES,LEVEL_NAMES,PUZZLE_TYPES,levelLabel,gridDescription,type PuzzleType,type Difficulty} from "./picture-puzzles-client";
export {DIFFICULTIES,LEVEL_NAMES,PUZZLE_TYPES,levelLabel,gridDescription};
export type PicturePuzzle={id:string;title:string;description:string;image_path:string;image_alt:string;learning_note:string;artist_credit:string;puzzle_type:PuzzleType;difficulty:Difficulty;level:number;status:"draft"|"published";created_at:string;};
export const PUZZLE_BUCKET="picture-puzzles";
const FIELDS="id,title,description,image_path,image_alt,learning_note,artist_credit,puzzle_type,difficulty,level,status,created_at";
export async function listPicturePuzzles(includeDrafts=false):Promise<PicturePuzzle[]|null>{
 const db=getSupabaseAdmin();if(!db)return null;
 const query=db.from("picture_puzzles").select(FIELDS).order("level",{ascending:true}).order("created_at",{ascending:true});
 const {data,error}=await(includeDrafts?query:query.eq("status","published"));
 if(error){console.error("Picture puzzle list:",error.code);return null;}
 return (data||[]) as PicturePuzzle[];
}
export async function getPicturePuzzle(id:string):Promise<PicturePuzzle|null>{
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const db=getSupabaseAdmin();if(!db)return null;
 const {data,error}=await db.from("picture_puzzles").select(FIELDS).eq("id",id).maybeSingle();
 if(error)return null;return data as PicturePuzzle|null;
}
export function picturePuzzleImage(path:string){
 const db=getSupabaseAdmin();if(!db||!path||path.includes("..")||path.startsWith("/"))return "";
 return db.storage.from(PUZZLE_BUCKET).getPublicUrl(path).data.publicUrl;
}
