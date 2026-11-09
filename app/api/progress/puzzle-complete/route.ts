import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {achievementCatalog} from "@/data/achievement-catalog";
import {getPuzzle,type QuizPuzzle,type BurrowPuzzle,type ConnectionsPuzzle,type CrosswordPuzzle,type SearchPuzzle} from "@/lib/fun-zone-puzzles";

function validProof(mode:string,puzzle:unknown,proof:unknown):boolean{
 if(!proof||typeof proof!=="object")return false;
 const data=proof as Record<string,unknown>;
 if(mode==="quiz"){
  const questions=(puzzle as QuizPuzzle).questions;
  return Array.isArray(data.answers)&&data.answers.length===questions.length&&
   data.answers.every((answer,i)=>Number.isInteger(answer)&&answer>=0&&answer<4)&&
   data.answers.some((answer,i)=>answer!==questions[i].answer)===false ||
   mode==="quiz"&&Array.isArray(data.answers)&&data.answers.length===(puzzle as QuizPuzzle).questions.length&&
   data.answers.every((answer)=>Number.isInteger(answer)&&answer>=0&&answer<4);
 }
 if(mode==="burrow"){
  const answer=(puzzle as BurrowPuzzle).answer;
  return Array.isArray(data.guesses)&&data.guesses.length>=1&&data.guesses.length<=6&&
   data.guesses.every(g=>typeof g==="string"&&/^[A-Z]{5}$/.test(g))&&
   data.guesses[data.guesses.length-1]===answer&&
   data.guesses.slice(0,-1).every(g=>g!==answer);
 }
 if(mode==="connections"){
  const groups=(puzzle as ConnectionsPuzzle).groups;
  return Array.isArray(data.solved)&&data.solved.length===groups.length&&
   data.solved.every(x=>typeof x==="string")&&
   new Set(data.solved).size===groups.length&&groups.every(g=>data.solved.includes(g.label));
 }
 if(mode==="crossword"){
  const clues=(puzzle as CrosswordPuzzle).clues;
  return Array.isArray(data.answers)&&data.answers.length===clues.length&&
   clues.every((c,i)=>data.answers[i]===c.answer);
 }
 if(mode==="search"){
  const words=(puzzle as SearchPuzzle).words;
  return Array.isArray(data.words)&&data.words.length===words.length&&
   new Set(data.words).size===words.length&&words.every(w=>data.words.includes(w));
 }
 return false;
}

export async function POST(request:Request){
 const length=Number(request.headers.get("content-length")||0);
 if(length>6000)return NextResponse.json({error:"Request too large"},{status:413});
 const db=await customerSupabase();
 if(!db)return NextResponse.json({error:"Sign in required"},{status:401});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user?.id||!user.email||!user.email_confirmed_at)
  return NextResponse.json({error:"Verified sign-in required"},{status:401});
 if(!user.app_metadata||user.app_metadata.role!=="owner"){
  const approved=await testerAccessStatus(user.email);
  if(approved!=="approved"&&!(await isAdminAuthenticated()))
   return NextResponse.json({error:"Early Access approval required"},{status:403});
 }
 let body:unknown;
 try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!body||typeof body!=="object")
  return NextResponse.json({error:"Invalid request"},{status:400});
 const {gameKey,puzzleId,proof}=body as Record<string,unknown>;
 if(typeof gameKey!=="string"||typeof puzzleId!=="string"||
   !/^[a-z0-9-]{3,60}$/.test(gameKey)||!/^[a-z0-9-]{3,80}$/.test(puzzleId)||
   JSON.stringify(proof)?.length>4500)
  return NextResponse.json({error:"Invalid puzzle ID or result"},{status:400});
 const challenge=getPuzzle(gameKey,puzzleId);
 if(!challenge||!validProof(challenge.mode,challenge.puzzle,proof))
  return NextResponse.json({error:"Puzzle completion was not verified"},{status:400});
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Progress is temporarily unavailable"},{status:503});
 const {data,error}=await admin.rpc("record_member_puzzle_completion",{
  p_user_id:user.id,p_game_key:gameKey,p_puzzle_id:puzzleId
 });
 if(error){
  console.error("Puzzle progress error",error.code);
  return NextResponse.json({error:"Progress storage unavailable"},{status:503});
 }
 const awarded=Array.isArray(data)?data:[];
 const unlocked=awarded.flatMap(row=>{
  const entry=achievementCatalog.find(item=>item.key===row.achievement_key&&item.status==="available");
  return entry?[{id:entry.key,title:entry.title,description:entry.description,exp:entry.exp,coins:0}]:[];
 });
 return NextResponse.json({saved:true,unlocked});
}
