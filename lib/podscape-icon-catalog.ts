import type {PodscapeIconName} from "@/components/PodscapeLineIcon";

/**
 * Canonical semantic icon assignments. One intent -> one reusable glyph.
 * Do not reuse these as random illustration, decoration, or text glyphs.
 */
export const funZoneIcons={
 "crossword-colony":"crossword",
 "colony-connections":"connections",
 "word-burrow":"letters",
 "species-detective":"search",
 "keepers-challenge":"challenge",
 "word-of-the-week":"book",
 "species-quiz":"quiz",
 "word-search":"word-search"
} as const satisfies Record<string,PodscapeIconName>;

export type FunZoneIconKey=keyof typeof funZoneIcons;
export function gameIcon(key:string):PodscapeIconName{
 return Object.prototype.hasOwnProperty.call(funZoneIcons,key)
  ?funZoneIcons[key as FunZoneIconKey]:"grid";
}
export const progressIcons={
 achievement:"achievement",
 completed:"check",
 locked:"lock",
 available:"arrow-right"
} as const satisfies Record<string,PodscapeIconName>;

export const editorIcons={
 customize:"edit",
 widgets:"grid",
 close:"close",
 done:"check"
} as const satisfies Record<string,PodscapeIconName>;
