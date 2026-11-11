import {notFound,redirect} from "next/navigation";
import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PlayGame} from "@/components/PlayGame";
import {getGame} from "@/lib/fun-zone-games";
import {getPuzzle,getPuzzles,puzzleEntries} from "@/lib/fun-zone-puzzles";
import {getFunZoneLearningNote} from "@/lib/fun-zone-learning";
import {getFunZoneProgress,canPlayPuzzle} from "@/lib/fun-zone-progress";
export const dynamic="force-dynamic";
export function generateStaticParams(){return puzzleEntries.filter(entry=>entry.gameKey!=="word-search").map(entry=>({game:entry.gameKey,puzzle:entry.puzzle.id}));}
export async function generateMetadata({params}:{params:Promise<{game:string;puzzle:string}>}):Promise<Metadata>{const {game,puzzle}=await params;const item=getGame(game);const challenge=getPuzzle(game,puzzle);return {title:item&&challenge?`${challenge.puzzle.title} | PodScape Labs`:"Puzzle",robots:{index:false,follow:false}};}
export default async function Page({params}:{params:Promise<{game:string;puzzle:string}>}){const {game,puzzle}=await params;const item=getGame(game),challenge=getPuzzle(game,puzzle);if(!item||!challenge)notFound();const progress=await getFunZoneProgress(game);if(!progress.available||!canPlayPuzzle(game,puzzle,progress.ids))redirect(`/fun-zone/${game}`);return <PlatformShell><PlayGame game={item} challenge={challenge} learningNote={getFunZoneLearningNote(game,getPuzzles(game).findIndex(e=>e.puzzle.id===puzzle))}/></PlatformShell>;}
