import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import { PuzzleLibrary, type PuzzleItem } from "@/components/PuzzleLibrary";

export const metadata:Metadata={title:"Word Search Library | PodScape Labs",robots:{index:false,follow:false}};
const puzzles:PuzzleItem[]=[
 {id:"genus-explorer",title:"Genus Explorer",description:"Find eight isopod genera hidden across the grid. Tap or swipe to select each word.",topic:"Taxonomy",difficulty:"Easy",href:"/fun-zone/word-search/genus-explorer",status:"playable"},
 {id:"leaf-litter",title:"Leaf Litter Basics",description:"A habitat-themed challenge exploring leaf litter, decay, and microhabitats.",topic:"Habitats",difficulty:"Easy",status:"upcoming"},
 {id:"keeper-essentials",title:"Keeper Essentials",description:"Explore the vocabulary of responsible isopod keeping.",topic:"Husbandry",difficulty:"Easy",status:"upcoming"},
 {id:"species-names",title:"Species Names",description:"Look for popular isopod species names and scientific terms.",topic:"Species",difficulty:"Medium",status:"upcoming"},
 {id:"anatomy-terms",title:"Anatomy Terms",description:"Discover the words behind isopod anatomy.",topic:"Biology",difficulty:"Medium",status:"upcoming"}
];
export default function Page(){return <PlatformShell><PuzzleLibrary title="Word Search" subtitle="Find the hidden words of the isopod world. Choose a puzzle to begin." puzzles={puzzles}/></PlatformShell>}
