import type {PodscapeIconName} from "./PodscapeLineIcon";
import {homeWidgetNames} from "./workspace-widget-labels";
import {initialHome, initialBottom, cleanPreference} from "./navigation-customization";
import {chooseThemePreference} from "@/lib/theme-runtime";
import {THEME_IDS, type ThemePreference} from "@/lib/theme-registry";

/**
 * Starter choices are deliberately additive to PodScape's existing layouts.
 * Presets never write anything until the visitor explicitly applies one.
 */
export type StarterFocus = "balanced" | "explorer" | "keeper" | "collector" | "play";
export type StarterAppearance = "keep" | ThemePreference;
export type StarterChoice = {
 id:StarterFocus;title:string;description:string;icon:PodscapeIconName;
 visible:string[];homeShortcuts:string[];bottomShortcuts:string[];preview:{label:string;icon:PodscapeIconName}[];
};
export const homeWidgetOrder = ["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins","marketNews"] as const;
export const starterChoices:StarterChoice[] = [
 {id:"balanced",title:"Balanced",description:"A little of everything, with fresh discoveries first.",icon:"home",
 visible:["recent"],homeShortcuts:[...initialHome],bottomShortcuts:[...initialBottom],
 preview:[{label:homeWidgetNames.recent,icon:"news"},{label:"Quick Shortcuts",icon:"grid"},{label:"Discovery Hero",icon:"leaf"}]},
 {id:"explorer",title:"Explorer",description:"Explore species, read care guides, and save favourites.",icon:"leaf",
 visible:["recent","guides","pins"],homeShortcuts:["ledger","guides","search","shop","community","podbound"],bottomShortcuts:["home","ledger","search","guides","menu"],
 preview:[{label:homeWidgetNames.recent,icon:"news"},{label:homeWidgetNames.guides,icon:"book"},{label:homeWidgetNames.pins,icon:"bookmark"}]},
 {id:"keeper",title:"Keeper",description:"Put your colonies, care schedule and progress up front.",icon:"jar",
 visible:["colony","schedule","progress","recent"],homeShortcuts:["manager","collection","scan","qr","ledger","guides"],bottomShortcuts:["home","manager","scan","collection","menu"],
 preview:[{label:homeWidgetNames.colony,icon:"jar"},{label:homeWidgetNames.schedule,icon:"calendar"},{label:homeWidgetNames.progress,icon:"achievement"}]},
 {id:"collector",title:"Collector",description:"Keep favourite species and your own colonies close.",icon:"bookmark",
 visible:["pins","colony","recent"],homeShortcuts:["ledger","collection","manager","shop","search","guides"],bottomShortcuts:["home","ledger","collection","shop","menu"],
 preview:[{label:homeWidgetNames.pins,icon:"bookmark"},{label:homeWidgetNames.colony,icon:"jar"},{label:homeWidgetNames.recent,icon:"news"}]},
 {id:"play",title:"Puzzle Lover",description:"Lead with Fun Zone games and achievement progress.",icon:"gamepad",
 visible:["games","progress","recent"],homeShortcuts:["fun-zone","progress","podbound","ledger","community","guides"],bottomShortcuts:["home","fun-zone","progress","podbound","menu"],
 preview:[{label:homeWidgetNames.games,icon:"gamepad"},{label:homeWidgetNames.progress,icon:"achievement"},{label:homeWidgetNames.recent,icon:"news"}]}
];

export const onboardingLayoutKey = "podscape-home-widgets-v2";
export const onboardingHomeNavKey = "podscape-nav-v1-home";
export const onboardingBottomNavKey = "podscape-nav-v1-bottom";
export type StarterPreferenceOptions = {
 focus:StarterFocus;
 appearance:StarterAppearance;
 shortcuts:boolean;
};

/**
 * Apply the selected starter as a single explicit choice. An existing layout
 * remains untouched when focus is null. Appearance is applied only on Finish.
 * Storage is staged before dispatching events so a failed write can roll back.
 */
export function applyStarterPreferences(options:StarterPreferenceOptions):boolean{
 const chosen=starterChoices.find(item=>item.id===options.focus);
 if(!chosen||!["keep","system",...THEME_IDS].includes(options.appearance))return false;
 const keys=[onboardingLayoutKey,onboardingHomeNavKey,onboardingBottomNavKey,"podscape-theme"] as const;
 const before=new Map<string,string|null>();
 try{
  for(const key of keys)before.set(key,localStorage.getItem(key));
  const saved=JSON.parse(localStorage.getItem(onboardingLayoutKey)||"null") as {order?:unknown;visible?:unknown}|null;
  const known=new Set<string>(homeWidgetOrder);
  const current=Array.isArray(saved?.order)?saved.order.filter((id):id is string=>typeof id==="string"&&known.has(id)):[];
  // A chosen starter is a deliberate reorder of the optional widgets; core
  // greeting/hero/shortcuts/spotlight stay in their established positions.
  const core=["greeting","hero","shortcuts","spotlight"];
  const order=[...new Set([...core,...chosen.visible,...current,...homeWidgetOrder])];
  localStorage.setItem(onboardingLayoutKey,JSON.stringify({order,visible:chosen.visible}));
  if(options.shortcuts){
   localStorage.setItem(onboardingHomeNavKey,JSON.stringify(cleanPreference(chosen.homeShortcuts,"home")));
   localStorage.setItem(onboardingBottomNavKey,JSON.stringify(cleanPreference(chosen.bottomShortcuts,"bottom")));
  }
  if(options.appearance!=="keep")chooseThemePreference(options.appearance);
 }catch{
  for(const [key,value] of before){
   try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}
  }
  return false;
 }
 window.dispatchEvent(new Event("podscape-home-widgets-changed"));
 if(options.shortcuts){
  for(const area of ["home","bottom"])window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area}}));
 }
 return true;
}
