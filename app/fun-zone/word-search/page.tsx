import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import { PuzzleLibrary, type PuzzleItem } from "@/components/PuzzleLibrary";
import { PinToHome } from "@/components/PinToHome";
import { customerSupabase } from "@/lib/customer-auth/server";
import {getPuzzles} from "@/lib/fun-zone-puzzles";
import {getFunZoneLearningNote} from "@/lib/fun-zone-learning";
import {getFunZoneProgress,canPlayPuzzle} from "@/lib/fun-zone-progress";
export const dynamic="force-dynamic";

export const metadata:Metadata={title:"Word Search Library | PodScape Labs",robots:{index:false,follow:false}};
const puzzleEntries=getPuzzles("word-search");

export default async function Page(){const {ids,available}=await getFunZoneProgress("word-search");const puzzles:PuzzleItem[]=puzzleEntries.map((entry,index)=>({id:entry.puzzle.id,title:entry.puzzle.title,description:entry.puzzle.description,learning:getFunZoneLearningNote("word-search",index),topic:"Word search",difficulty:entry.puzzle.difficulty,href:`/fun-zone/word-search/${entry.puzzle.id}`,status:ids.has(entry.puzzle.id)?"completed":available&&canPlayPuzzle("word-search",entry.puzzle.id,ids)?"playable":"locked"}));const db=await customerSupabase();const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};return <PlatformShell><div style={{padding:"12px 18px 0",maxWidth:1140,margin:"auto"}}><PinToHome pin={{kind:"game",id:"word-search"}} userId={user?.id||null}/></div><PuzzleLibrary gameKey="word-search" title="Word Search" subtitle="Start with familiar words and build toward scientific names, one level at a time." puzzles={puzzles}/></PlatformShell>}
