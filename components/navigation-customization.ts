import type { PodscapeIconName } from "./PodscapeLineIcon";

export type NavChoice={id:string;label:string;href:string;icon:PodscapeIconName;tone:"sage"|"sand"|"rose"};
export const navigationChoices:NavChoice[]=[
  {id:"home",label:"Home",href:"/app",icon:"home",tone:"sage"},
  {id:"shop",label:"Shop",href:"/shop",icon:"shop",tone:"sand"},
  {id:"scan",label:"Scan",href:"/keeper/scan",icon:"scan",tone:"sage"},
  {id:"manager",label:"Manager",href:"/keeper",icon:"manager",tone:"sage"},
  {id:"menu",label:"Menu",href:"/menu",icon:"menu",tone:"sand"},
  {id:"ledger",label:"Ledger",href:"/ledger",icon:"leaf",tone:"sage"},
  {id:"fun-zone",label:"Fun Zone",href:"/fun-zone",icon:"creative",tone:"rose"},
  {id:"community",label:"Community",href:"/community",icon:"community",tone:"sage"},
  {id:"guides",label:"Guides",href:"/field-guide",icon:"book",tone:"sage"},
  {id:"podbound",label:"PodBound",href:"/podbound",icon:"podbound",tone:"sand"},
  {id:"account",label:"Account",href:"/account",icon:"community",tone:"sage"},
  {id:"collection",label:"My Collection",href:"/ledger/my-collection",icon:"jar",tone:"sage"},
];
export const initialBottom=["home","shop","scan","manager","menu"];
export const initialHome=["ledger","shop","fun-zone","community","guides","podbound"];
export const choiceById=new Map(navigationChoices.map(item=>[item.id,item]));
export type PreferenceArea="bottom"|"home";
export function cleanPreference(value:unknown,area:PreferenceArea):string[]{
  const defaults=area==="bottom"?initialBottom:initialHome;
  const expected=defaults.length;
  if(!Array.isArray(value)||value.length!==expected||value.some(id=>typeof id!=="string"||!choiceById.has(id))||new Set(value).size!==expected)return [...defaults];
  return value as string[];
}
export function readPreference(area:PreferenceArea):string[]{
  try{return cleanPreference(JSON.parse(localStorage.getItem("podscape-nav-v1-"+area)||"null"),area)}
  catch{return area==="bottom"?[...initialBottom]:[...initialHome]}
}
export function writePreference(area:PreferenceArea,ids:string[]){
  const next=cleanPreference(ids,area);
  try{localStorage.setItem("podscape-nav-v1-"+area,JSON.stringify(next));window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area}}))}catch{}
}
export function swapNavigationSlot(ids:string[],index:number,nextId:string){
  const previous=ids.indexOf(nextId);
  const next=[...ids];
  if(previous>=0){next[previous]=ids[index];}
  next[index]=nextId;
  return next;
}
export function moveNavigationSlot(ids:string[],from:number,to:number){
  if(from===to||from<0||to<0||from>=ids.length||to>=ids.length)return ids;
  const next=[...ids];const [item]=next.splice(from,1);next.splice(to,0,item);return next;
}
