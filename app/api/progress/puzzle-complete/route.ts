import {NextResponse} from "next/server";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {testerAccessStatus} from "@/lib/customer-auth/access";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import {achievementCatalog} from "@/data/achievement-catalog";
import {getPuzzle,getPuzzles,type QuizPuzzle,type BurrowPuzzle,type ConnectionsPuzzle,type CrosswordPuzzle,type SearchPuzzle} from "@/lib/fun-zone-puzzles";
import {getPicturePuzzle,listPicturePuzzles} from "@/lib/picture-puzzles";
import {DIFFICULTIES} from "@/lib/picture-puzzles-client";

function validPictureProof(mode:string,difficulty:keyof typeof DIFFICULTIES,proof:unknown):boolean{
 if(!proof||typeof proof!=="object")return false;
 const data=proof as Record<string,unknown>,size=DIFFICULTIES[difficulty].columns,count=size*size;
 if(mode==="jigsaw")return Array.isArray(data.placed)&&data.placed.length===count&&
  new Set(data.placed).size===count&&data.placed.every(x=>Number.isInteger(x)&&x>=0&&x<count)&&
  Number.isInteger(data.moves)&&Number(data.moves)>=count;
 if(mode!=="sliding")return false;
 const initial=data.initial,steps=data.steps;
 if(!Array.isArray(initial)||initial.length!==count||new Set(initial).size!==count||
    !initial.every(n=>Number.isInteger(n)&&n>=0&&n<count)||!Array.isArray(steps)||
    steps.length<1||steps.length>1000||!steps.every(n=>Number.isInteger(n)&&n>=0&&n<count))return false;
 const board=[...initial],blank=count-1;
 if(board.every((n,i)=>n===i))return false;
 for(const index of steps){
  const hole=board.indexOf(blank);
  if(Math.abs(Math.floor(hole/size)-Math.floor(index/size))+Math.abs(hole%size-index%size)!==1)return false;
  [board[index],board[hole]]=[board[hole],board[index]];
 }
 return board.every((n,i)=>n===i);
}
function validProof(mode:string,puzzle:unknown,proof:unknown):boolean{
 if(!proof||typeof proof!=="object")return false;
 const data=proof as Record<string,unknown>;
 if(mode==="quiz"){
  const questions=(puzzle as QuizPuzzle).questions;
  // Quiz completion requires a perfect round, not merely participation.
  // The client cannot unlock a new puzzle or earn EXP with incorrect answers.
  const answers=data.answers;
  return Array.isArray(answers)&&answers.length===questions.length&&
   questions.every((question,index)=>answers[index]===question.answer);
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
  const solved=data.solved;
  return Array.isArray(solved)&&solved.length===groups.length&&
   solved.every(x=>typeof x==="string")&&new Set(solved).size===groups.length&&
   groups.every(g=>solved.includes(g.label));
 }
 if(mode==="crossword"){
  const clues=(puzzle as CrosswordPuzzle).clues;
  const answers=data.answers;
  return Array.isArray(answers)&&answers.length===clues.length&&
   clues.every((c,i)=>answers[i]===c.answer);
 }
 if(mode==="search"){
  const words=(puzzle as SearchPuzzle).words;
  const submitted=data.words;
  return Array.isArray(submitted)&&submitted.length===words.length&&
   new Set(submitted).size===words.length&&words.every(w=>submitted.includes(w));
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
 let previousPuzzleId:string|null=null;
 if(gameKey==="picture-puzzles"){
  const challenge=await getPicturePuzzle(puzzleId);
  if(!challenge||challenge.status!=="published"||!validPictureProof(challenge.puzzle_type,challenge.difficulty,proof))
   return NextResponse.json({error:"Picture puzzle completion was not verified"},{status:400});
  const published=await listPicturePuzzles();
  if(!published)return NextResponse.json({error:"Progress storage unavailable"},{status:503});
  const index=published.findIndex(p=>p.id===puzzleId);
  if(index<0)return NextResponse.json({error:"Puzzle unavailable"},{status:404});
  previousPuzzleId=index>0?published[index-1].id:null;
 }else{
  const challenge=getPuzzle(gameKey,puzzleId);
  if(!challenge||!validProof(challenge.mode,challenge.puzzle,proof))
   return NextResponse.json({error:"Puzzle completion was not verified"},{status:400});
  const ordered=getPuzzles(gameKey);
  const index=ordered.findIndex(entry=>entry.puzzle.id===puzzleId);
  previousPuzzleId=index>0?ordered[index-1].puzzle.id:null;
 }
 const admin=getSupabaseAdmin();
 if(!admin)return NextResponse.json({error:"Progress is temporarily unavailable"},{status:503});
 // Compare earned achievements around the verified completion so trigger-based
 // hidden milestones can use the same existing toast without a second payout.
 const {data:beforeBadges,error:beforeError}=await admin.from("member_achievements")
  .select("achievement_key").eq("user_id",user.id);
 const {data,error}=await admin.rpc("record_member_puzzle_completion",{
  p_user_id:user.id,p_game_key:gameKey,p_puzzle_id:puzzleId,p_previous_puzzle_id:previousPuzzleId
 });
 if(error){
  console.error("Puzzle progress error",error.code);
  return NextResponse.json({error:"Progress storage unavailable"},{status:503});
 }
 const awarded=Array.isArray(data)?data:[];
 const unlocked=awarded.flatMap(row=>{
  const entry=achievementCatalog.find(item=>item.key===row.achievement_key&&item.status==="available");
  return entry?[{id:entry.key,title:entry.title,description:entry.description,exp:entry.exp,hidden:entry.hidden===true}]:[];
 });
 if(!beforeError){
  const {data:afterBadges,error:afterError}=await admin.from("member_achievements")
   .select("achievement_key").eq("user_id",user.id);
  if(!afterError){
   const previous=new Set((beforeBadges||[]).map(x=>x.achievement_key));
   const announced=new Set(unlocked.map(x=>x.id));
   for(const row of afterBadges||[]){
    if(previous.has(row.achievement_key)||announced.has(row.achievement_key))continue;
    const badge=achievementCatalog.find(x=>x.key===row.achievement_key&&x.status==="available");
    if(badge){
     unlocked.push({id:badge.key,title:badge.title,description:badge.description,exp:badge.exp,hidden:badge.hidden===true});
     announced.add(badge.key);
    }
   }
  }
 }
 return NextResponse.json({saved:true,unlocked});
}
