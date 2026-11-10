import type {PodscapeIconName} from "./PodscapeLineIcon";
import {initialHome, initialBottom, cleanPreference} from "./navigation-customization";

/**
 * Starter choices are deliberately additive to PodScape's existing layouts.
 * Presets never write anything until the visitor explicitly applies one.
 */
export type StarterFocus = "balanced" | "explorer" | "keeper" | "collector" | "play";
export type StarterAppearance = "keep" | "light" | "dark" | "system";
export type StarterChoice = {
 id:StarterFocus;title:string;description:string;icon:PodscapeIconName;
 visible:string[];homeShortcuts:string[];bottomShortcuts:string[];preview:{label:string;icon:PodscapeIconName}[];
};
export const homeWidgetOrder = ["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins"] as const;
export const starterChoices:StarterChoice[] = [
 {id:"balanced",title:"Balanced",description:"A little of everything, with fresh discoveries first.",icon:"home",
 visible:["recent"],homeShortcuts:[...initialHome],bottomShortcuts:[...initialBottom],
 preview:[{label:"Recent & Noteworthy",icon:"news"},{label:"Quick Shortcuts",icon:"grid"},{label:"Discovery Hero",icon:"leaf"}]},
 {id:"explorer",title:"Explorer",description:"Explore species, read care guides, and save favourites.",icon:"leaf",
 visible:["recent","guides","pins"],homeShortcuts:["ledger","guides","search","shop","community","podbound"],bottomShortcuts:["home","ledger","search","guides","menu"],
 preview:[{label:"Recent & Noteworthy",icon:"news"},{label:"Field Guide",icon:"book"},{label:"My Favorites",icon:"bookmark"}]},
 {id:"keeper",title:"Keeper",description:"Put your colonies, care schedule and progress up front.",icon:"jar",
 visible:["colony","schedule","progress","recent"],homeShortcuts:["manager","collection","scan","qr","ledger","guides"],bottomShortcuts:["home","manager","scan","collection","menu"],
 preview:[{label:"My Colony",icon:"jar"},{label:"Care Schedule",icon:"calendar"},{label:"My Progress",icon:"achievement"}]},
 {id:"collector",title:"Collector",description:"Keep favourite species and your own colonies close.",icon:"bookmark",
 visible:["pins","colony","recent"],homeShortcuts:["ledger","collection","manager","shop","search","guides"],bottomShortcuts:["home","ledger","collection","shop","menu"],
 preview:[{label:"My Favorites",icon:"bookmark"},{label:"My Colony",icon:"jar"},{label:"Recent & Noteworthy",icon:"news"}]},
 {id:"play",title:"Puzzle Lover",description:"Lead with Fun Zone games and achievement progress.",icon:"gamepad",
 visible:["games","progress","recent"],homeShortcuts:["fun-zone","progress","podbound","ledger","community","guides"],bottomShortcuts:["home","fun-zone","progress","podbound","menu"],
 preview:[{label:"Play a Little",icon:"gamepad"},{label:"My Progress",icon:"achievement"},{label:"Recent & Noteworthy",icon:"news"}]}
];

export const onboardingLayoutKey = "podscape-home-widgets-v2";
export const onboardingHomeNavKey = "podscape-nav-v1-home";
export const onboardingBottomNavKey = "podscape-nav-v1-bottom";
export type StarterPreferenceOptions = {
 focus:StarterFocus;
 appearance:StarterAppearance;
 shortcuts:boolean;
};

export function applyStarterPreferences(options:StarterPreferenceOptions):boolean {
 const chosen=starterChoices.find(item=>item.id===options.focus);
 if(!chosen)return false;
 try {
  // Preserve any existing block order; only replace visible optional widgets.
  const saved=JSON.parse(localStorage.getItem(onboardingLayoutKey)||"null") as {order?:unknown;visible?:unknown}|null;
  const known=new Set<string>(homeWidgetOrder);
  const current=Array.isArray(saved?.order)?saved.order.filter((id):id is string=>typeof id==="string"&&known.has(id)):[];
  const order=[...new Set([...current,...homeWidgetOrder])];
  localStorage.setItem(onboardingLayoutKey,JSON.stringify({order,visible:chosen.visible}));
  window.dispatchEvent(new Event("podscape-home-widgets-changed"));
  if(options.shortcuts){
   localStorage.setItem(onboardingHomeNavKey,JSON.stringify(cleanPreference(chosen.homeShortcuts,"home")));
   localStorage.setItem(onboardingBottomNavKey,JSON.stringify(cleanPreference(chosen.bottomShortcuts,"bottom")));
   for(const area of ["home","bottom"]){
    window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area}}));
   }
  }
  if(options.appearance!=="keep"){
   if(options.appearance==="system")localStorage.removeItem("podscape-theme");
   else localStorage.setItem("podscape-theme",options.appearance);
   const theme=options.appearance==="system"
    ?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):options.appearance;
   document.documentElement.dataset.theme=theme;
   document.documentElement.dataset.themePreference=options.appearance;
   document.documentElement.style.colorScheme=theme;
   window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
  }
  return true;
 }catch{return false}
}
