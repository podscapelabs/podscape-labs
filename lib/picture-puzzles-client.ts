/** Shared, browser-safe Fun Zone progression vocabulary and picture-puzzle options. */
export const LEVEL_NAMES=["Starter","Familiar","Explorer","Practiced","Specialist","Expert"] as const;
export const PUZZLE_TYPES={jigsaw:"Jigsaw",sliding:"Sliding Puzzle"} as const;
export type PuzzleType=keyof typeof PUZZLE_TYPES;
export type Difficulty="easy"|"medium"|"hard";
export type PicturePuzzle={difficulty:Difficulty;puzzle_type:PuzzleType;level:number};
export const DIFFICULTIES={easy:{label:"Easy",columns:3,rows:3},medium:{label:"Medium",columns:4,rows:4},hard:{label:"Hard",columns:5,rows:5}} as const;
export function levelLabel(level:number){return "Level "+level+" · "+(LEVEL_NAMES[level-1]||"Mastery");}
export function gridDescription(type:PuzzleType,difficulty:Difficulty){const {columns,rows}=DIFFICULTIES[difficulty];return type==="sliding"?columns+" × "+rows+" · "+(columns*rows-1)+" tiles + gap":columns+" × "+rows+" · "+(columns*rows)+" pieces";}
