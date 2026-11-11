import "server-only";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getPuzzles} from "@/lib/fun-zone-puzzles";

/** Server-verified completion rows for the active signed-in account. */
export async function getFunZoneProgress(gameKey:string){
 const db=await customerSupabase();
 if(!db)return {ids:new Set<string>(),available:false};
 const {data:{user}}=await db.auth.getUser();
 if(!user)return {ids:new Set<string>(),available:false};
 const {data,error}=await db.from("member_puzzle_completions").select("puzzle_id").eq("user_id",user.id).eq("game_key",gameKey);
 if(error){console.error("Puzzle progress query failed",error.code);return {ids:new Set<string>(),available:false};}
 const known=new Set(getPuzzles(gameKey).map(e=>e.puzzle.id));
 return {ids:new Set((data||[]).map(x=>String(x.puzzle_id)).filter(x=>known.has(x))),available:true};
}
export function canPlayPuzzle(gameKey:string,puzzleId:string,completed:Set<string>){
 const challenges=getPuzzles(gameKey),index=challenges.findIndex(x=>x.puzzle.id===puzzleId);
 return index>=0&&(completed.has(puzzleId)||index===0||completed.has(challenges[index-1].puzzle.id));
}
