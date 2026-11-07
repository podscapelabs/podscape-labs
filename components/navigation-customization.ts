import type { PodscapeIconName } from "./PodscapeLineIcon";

export type NavGroup="Main"|"Discover"|"Keeper tools"|"Play & projects"|"Community & studio"|"Coming later";
export type NavChoice={id:string;label:string;href:string;icon:PodscapeIconName;tone:"sage"|"sand"|"rose";group:NavGroup;description:string;planned?:boolean};
export const navigationChoices:NavChoice[]=[
  {id:"home",label:"Home",href:"/app",icon:"home",tone:"sage",group:"Main",description:"Your Podscape homepage"},
  {id:"menu",label:"Menu",href:"/menu",icon:"menu",tone:"sand",group:"Main",description:"Explore all Podscape features"},
  {id:"account",label:"My Podscape",href:"/account",icon:"community",tone:"sage",group:"Main",description:"Your profile, rewards and account settings"},
  {id:"shop",label:"Shop",href:"/shop",icon:"shop",tone:"sand",group:"Discover",description:"Browse the Podscape shop"},
  {id:"ledger",label:"Ledger",href:"/ledger",icon:"leaf",tone:"sage",group:"Discover",description:"Explore species in the Leaf Ledger"},
  {id:"guides",label:"Field Guides",href:"/field-guide",icon:"book",tone:"sage",group:"Discover",description:"Husbandry guides and resources"},
  {id:"collection",label:"My Collection",href:"/keeper/collection",icon:"jar",tone:"sage",group:"Keeper tools",description:"Your species, bins and colonies"},
  {id:"manager",label:"Manager",href:"/keeper",icon:"manager",tone:"sage",group:"Keeper tools",description:"Your colony manager dashboard"},
  {id:"scan",label:"Scan Bin",href:"/keeper/scan",icon:"scan",tone:"sage",group:"Keeper tools",description:"Scan an enclosure QR code"},
  {id:"qr",label:"QR Creator",href:"/keeper/qr",icon:"qr",tone:"sage",group:"Keeper tools",description:"Create enclosure QR labels"},
  {id:"schedule",label:"Care Schedule",href:"/keeper/schedule",icon:"calendar",tone:"sage",group:"Keeper tools",description:"View your colony care schedule"},
  {id:"fun-zone",label:"Fun Zone",href:"/fun-zone",icon:"creative",tone:"rose",group:"Play & projects",description:"Puzzles, games and quizzes"},
  {id:"podbound",label:"PodBound",href:"/podbound",icon:"podbound",tone:"sand",group:"Play & projects",description:"Original isopod strategy card game"},
  {id:"podbound-cards",label:"Card Catalogue",href:"/podbound/cards",icon:"podbound",tone:"sand",group:"Play & projects",description:"Browse published PodBound game cards"},
  {id:"progress",label:"My Progress",href:"/account/progress",icon:"leaf",tone:"sage",group:"Play & projects",description:"Achievements, levels and EXP"},
  {id:"community",label:"Community",href:"/community",icon:"community",tone:"sage",group:"Community & studio",description:"The Podscape keeper community"},
  {id:"lab",label:"From the Lab",href:"/from-the-lab",icon:"note",tone:"rose",group:"Community & studio",description:"Projects and studio updates"},
  {id:"explore",label:"Explore Podscape",href:"/explore",icon:"leaf",tone:"sage",group:"Community & studio",description:"A map of the Podscape ecosystem"},
  {id:"vendor-directory",label:"Vendor Directory",href:"/explore#vendor-directory",icon:"vendor",tone:"sand",group:"Coming later",description:"Future directory for hobby breeders and businesses",planned:true},
  {id:"creative-network",label:"Creative Network",href:"/explore#creative-network",icon:"creative",tone:"rose",group:"Coming later",description:"Future network for artists and makers",planned:true},
];
export const navigationGroups:NavGroup[]=["Main","Discover","Keeper tools","Play & projects","Community & studio","Coming later"];
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
