import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {PlatformShell} from "@/components/PlatformShell";
import {PlayGame} from "@/components/PlayGame";
import {getGame,games} from "@/lib/fun-zone-games";
export function generateStaticParams(){return games.map(game=>({game:game.key,puzzle:"sample-01"}));}
export async function generateMetadata({params}:{params:Promise<{game:string;puzzle:string}>}):Promise<Metadata>{const {game,puzzle}=await params;const item=getGame(game);return {title:item&&puzzle==="sample-01"?`${item.puzzleTitle} | PodScape Labs`:"Puzzle",robots:{index:false,follow:false}};}
export default async function Page({params}:{params:Promise<{game:string;puzzle:string}>}){const {game,puzzle}=await params;const item=getGame(game);if(!item||puzzle!=="sample-01")notFound();return <PlatformShell><PlayGame game={item}/></PlatformShell>;}
