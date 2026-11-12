import {games as puzzles} from "./fun-zone-games";
import {gameIcon} from "./podscape-icon-catalog";
import type {PodscapeIconName} from "@/components/PodscapeLineIcon";

/** One registry for the Fun Zone portal, categories, favourites and future games.
 * Puzzle route keys and completion tracking remain unchanged.
 */
export const ARCADE_CATEGORIES=["Word Games","Puzzles & Logic","Trivia & Knowledge","Simulations","PodBound"] as const;
export type ArcadeCategory=typeof ARCADE_CATEGORIES[number];
export type ArcadeGame={key:string;title:string;description:string;category:ArcadeCategory;href:string;icon:PodscapeIconName;beta?:boolean;featured?:boolean;};
const categoryFromPuzzle=(category:string,key:string):ArcadeCategory=>{
 if(key==="colony-connections")return "Puzzles & Logic";
 if(category==="Word"||key==="word-burrow"||key==="word-of-the-week"||key==="crossword-colony")return "Word Games";
 if(category==="Logic")return "Puzzles & Logic";
 return "Trivia & Knowledge";
};
// Discovery order is based on onboarding ease, not alphabetical game title.
 // This only changes the catalogue; saved game keys, favourites and completions stay intact.
const discoveryOrder:Record<string,number>={
 "species-quiz":1,"word-search":2,"word-burrow":3,"word-of-the-week":4,
 "species-detective":5,"keepers-challenge":6,"colony-connections":7,
 "crossword-colony":8,"picture-puzzles":9,"pod-exchange":10
};
export const ARCADE_GAMES:ArcadeGame[]=([ 
 ...puzzles.map(game=>({
  key:game.key,title:game.title,description:game.subtitle,
  category:categoryFromPuzzle(game.category,game.key),
  href:"/fun-zone/"+game.key,icon:gameIcon(game.key),
  featured:game.key==="word-burrow"
 })),
 {key:"word-search",title:"Word Search",description:"Start with familiar words, then discover anatomy and scientific names.",category:"Word Games",href:"/fun-zone/word-search",icon:"word-search"},
 {key:"picture-puzzles",title:"Picture Puzzles",description:"Rebuild PodBound artwork and isopod photos, piece by piece.",category:"Puzzles & Logic",href:"/fun-zone/picture-puzzles",icon:"grid",featured:true},
 {key:"pod-exchange",title:"The Pod Exchange",description:"Trade fictional stocks using Duck Bucks.",category:"Simulations",href:"/fun-zone/pod-exchange",icon:"gamepad",beta:true,featured:true}
] as ArcadeGame[]).sort((a,b)=>(discoveryOrder[a.key]??99)-(discoveryOrder[b.key]??99));
export const ARCADE_GAME_KEYS=ARCADE_GAMES.map(g=>g.key);
export const categoryCounts=Object.fromEntries(ARCADE_CATEGORIES.map(category=>[category,ARCADE_GAMES.filter(game=>game.category===category).length])) as Record<ArcadeCategory,number>;
export const GAME_FAVOURITES_KEY="podscape:fun-zone:favourites-v1";
export const ARCADE_LAYOUT_KEY="podscape:fun-zone:portal-v1";
export function normaliseFavourites(value:unknown):string[]{
 return Array.isArray(value)?[...new Set(value.filter((key):key is string=>typeof key==="string"&&ARCADE_GAME_KEYS.includes(key)))]:[];
}
