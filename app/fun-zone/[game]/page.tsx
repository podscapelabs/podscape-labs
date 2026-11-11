import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PuzzleLibrary,type PuzzleItem} from "@/components/PuzzleLibrary";
import {PinToHome} from "@/components/PinToHome";
import {customerSupabase} from "@/lib/customer-auth/server";
import {getGame,games} from "@/lib/fun-zone-games";
import {getPuzzles} from "@/lib/fun-zone-puzzles";
import {getFunZoneLearningNote} from "@/lib/fun-zone-learning";
import {getFunZoneProgress,canPlayPuzzle} from "@/lib/fun-zone-progress";
export const dynamic="force-dynamic";
export function generateStaticParams(){return games.map(game=>({game:game.key}));}
export async function generateMetadata({params}:{params:Promise<{game:string}>}):Promise<Metadata>{const game=getGame((await params).game);return {title:game?`${game.title} Library | PodScape Labs`:"Puzzle Library",robots:{index:false,follow:false}};}
export default async function Page({params}:{params:Promise<{game:string}>}){
 const game=getGame((await params).game);if(!game)notFound();
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const {ids,available}=await getFunZoneProgress(game.key);
 const puzzles:PuzzleItem[]=getPuzzles(game.key).map((entry,index)=>({id:entry.puzzle.id,title:entry.puzzle.title,description:entry.puzzle.description,learning:getFunZoneLearningNote(game.key,index),topic:game.category,difficulty:entry.puzzle.difficulty,href:`/fun-zone/${game.key}/${entry.puzzle.id}`,status:ids.has(entry.puzzle.id)?"completed":available&&canPlayPuzzle(game.key,entry.puzzle.id,ids)?"playable":"locked"}));
 return <PlatformShell><div style={{padding:"12px 18px 0",maxWidth:1140,margin:"auto"}}><PinToHome pin={{kind:"game",id:game.key}} userId={user?.id||null}/></div><PuzzleLibrary gameKey={game.key} title={game.title} subtitle={game.subtitle} puzzles={puzzles}/></PlatformShell>;
}
