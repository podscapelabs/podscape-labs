import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PuzzleLibrary,type PuzzleItem} from "@/components/PuzzleLibrary";
import {getGame,games} from "@/lib/fun-zone-games";
export function generateStaticParams(){return games.map(game=>({game:game.key}));}
export async function generateMetadata({params}:{params:Promise<{game:string}>}):Promise<Metadata>{const game=getGame((await params).game);return {title:game?`${game.title} Library | PodScape Labs`:"Puzzle Library",robots:{index:false,follow:false}};}
export default async function Page({params}:{params:Promise<{game:string}>}){
 const game=getGame((await params).game);if(!game)notFound();
 const puzzles:PuzzleItem[]=[{id:"sample-01",title:game.puzzleTitle,description:game.description,topic:game.category,difficulty:"Intro",href:`/fun-zone/${game.key}/sample-01`,status:"playable"}];
 return <PlatformShell><PuzzleLibrary title={game.title} subtitle={game.subtitle} puzzles={puzzles}/></PlatformShell>;
}
