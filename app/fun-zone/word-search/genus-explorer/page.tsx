import type { Metadata } from "next";
import {redirect} from "next/navigation";
import {getFunZoneProgress,canPlayPuzzle} from "@/lib/fun-zone-progress";
export const dynamic="force-dynamic";
import { PlatformShell } from "@/components/PlatformShell";
import GenusWordSearch from "../GenusWordSearch";
import {getPuzzle,type SearchPuzzle} from "@/lib/fun-zone-puzzles";
export const metadata:Metadata={title:"Genus Explorer | PodScape Labs",robots:{index:false,follow:false}};
export default async function Page(){const p=await getFunZoneProgress("word-search");if(!p.available||!canPlayPuzzle("word-search","genus-explorer",p.ids))redirect("/fun-zone/word-search");return <PlatformShell><GenusWordSearch puzzleData={getPuzzle("word-search","genus-explorer")!.puzzle as SearchPuzzle}/></PlatformShell>}
