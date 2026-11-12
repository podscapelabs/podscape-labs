/** Safe, browser-compatible picture puzzle configuration. */
export type PicturePuzzle={difficulty:"easy"|"medium"|"hard"};
export const DIFFICULTIES={easy:{label:"Easy",columns:3,rows:3},medium:{label:"Medium",columns:4,rows:4},hard:{label:"Hard",columns:5,rows:5}} as const;
