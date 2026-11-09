import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PlayGame} from "@/components/PlayGame";
import {getGame} from "@/lib/fun-zone-games";
import {getPuzzle,puzzleEntries} from "@/lib/fun-zone-puzzles";
export function generateStaticParams(){return puzzleEntries.filter(entry=>entry.gameKey!=="word-search").map(entry=>({game:entry.gameKey,puzzle:entry.puzzle.id}));}
export async function generateMetadata({params}:{params:Promise<{game:string;puzzle:string}>}):Promise<Metadata>{const {game,puzzle}=await params;const item=getGame(game);const challenge=getPuzzle(game,puzzle);return {title:item&&challenge?`${challenge.puzzle.title} | PodScape Labs`:"Puzzle",robots:{index:false,follow:false}};}
export default async function Page({params}:{params:Promise<{game:string;puzzle:string}>}){const {game,puzzle}=await params;const item=getGame(game),challenge=getPuzzle(game,puzzle);if(!item||!challenge)notFound();return <PlatformShell><PlayGame game={item} challenge={challenge}/></PlatformShell>;}
