import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import GenusWordSearch from "../GenusWordSearch";
import {getPuzzle,type SearchPuzzle} from "@/lib/fun-zone-puzzles";
export const metadata:Metadata={title:"Genus Explorer | PodScape Labs",robots:{index:false,follow:false}};
export default function Page(){return <PlatformShell><GenusWordSearch puzzleData={getPuzzle("word-search","genus-explorer")!.puzzle as SearchPuzzle}/></PlatformShell>}
