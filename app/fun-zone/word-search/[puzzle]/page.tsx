import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PlatformShell} from "@/components/PlatformShell";
import {getPuzzle,getPuzzles,type SearchPuzzle} from "@/lib/fun-zone-puzzles";
import GenusWordSearch from "../GenusWordSearch";
export function generateStaticParams(){
 return getPuzzles("word-search").filter(entry=>entry.puzzle.id!=="genus-explorer").map(entry=>({puzzle:entry.puzzle.id}));
}
export async function generateMetadata({params}:{params:Promise<{puzzle:string}>}):Promise<Metadata>{
 const entry=getPuzzle("word-search",(await params).puzzle);
 return {title:entry?`${entry.puzzle.title} | PodScape Labs`:"Word Search",robots:{index:false,follow:false}};
}
export default async function Page({params}:{params:Promise<{puzzle:string}>}){
 const entry=getPuzzle("word-search",(await params).puzzle);
 if(!entry||entry.mode!=="search")notFound();
 return <PlatformShell><GenusWordSearch puzzleData={entry.puzzle as SearchPuzzle}/></PlatformShell>;
}
