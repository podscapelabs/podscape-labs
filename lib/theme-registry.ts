/** PodScape theme registry.
 * Adding a theme starts here. Shared components use semantic CSS roles instead of
 * theme-specific colour values; CSS palettes and loading art are validated by
 * scripts/verify-theme-system.mjs. System is a preference, not a sixth palette.
 */
export const THEMES = [
 {id:"light",title:"Light",description:"Botanical parchment",scheme:"light",colors:["#e9e4d2","#f5f0df","#173d2b"]},
 {id:"dark",title:"Dark",description:"Midnight forest",scheme:"dark",colors:["#101b18","#1b2923","#c3d09f"]},
 {id:"woodland",title:"Woodland",description:"Cocoa & chestnut",scheme:"dark",colors:["#211a16","#30251f","#d6ac76"]},
 {id:"lilac",title:"Lilac",description:"Lavender & plum",scheme:"light",colors:["#ebe0f1","#e6d1ed","#70418b"]},
 {id:"ember",title:"Ember",description:"Apricot & terracotta",scheme:"light",colors:["#f7e5d1","#f2d7b9","#a64c21"]},
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export type ThemePreference = ThemeId | "system";
export const THEME_IDS = THEMES.map(theme=>theme.id);
export const THEME_STORAGE_KEY = "podscape-theme";
export const SYSTEM_OPTION = {id:"system",title:"System",description:"Match your device",colors:["#e9e4d2","#1b2923","#c3d09f"]} as const;
export function isThemeId(value:unknown):value is ThemeId{
 return typeof value==="string" && THEME_IDS.some(id=>id===value);
}
export function isThemePreference(value:unknown):value is ThemePreference{
 return value==="system"||isThemeId(value);
}
export function themeColorScheme(theme:ThemeId):"light"|"dark"{
 return THEMES.find(entry=>entry.id===theme)?.scheme??"light";
}
export function resolveTheme(mode:ThemePreference,systemDark:boolean):ThemeId{
 return mode==="system"?(systemDark?"dark":"light"):mode;
}
