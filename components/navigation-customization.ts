import type { PodscapeIconName } from "./PodscapeLineIcon";

export type NavGroup="Main"|"Discover"|"Keeper tools"|"Play & projects"|"Community & studio"|"Coming later"|"Owner";
export type NavChoice={id:string;label:string;href:string;icon:PodscapeIconName;tone:"sage"|"sand"|"rose";group:NavGroup;description:string;planned?:boolean;ownerOnly?:boolean};
export const navigationChoices:NavChoice[]=[
  {id:"owner-tools",label:"Owner Tools",href:"/account/owner-tools",icon:"manager",tone:"sage",group:"Owner",description:"Your private owner management desks",ownerOnly:true},
  {id:"owner-analytics",label:"Analytics",href:"/account/owner-tools/analytics",icon:"community",tone:"sage",group:"Owner",description:"Private platform growth and activity metrics",ownerOnly:true},
  {id:"owner-species",label:"Species Desk",href:"/admin/species",icon:"leaf",tone:"sage",group:"Owner",description:"Edit and publish Leaf Ledger species records",ownerOnly:true},
  {id:"owner-products",label:"Product Desk",href:"/admin/products",icon:"shop",tone:"sand",group:"Owner",description:"Manage products, prices and inventory",ownerOnly:true},
  {id:"owner-guides",label:"Guide Desk",href:"/admin/guides",icon:"book",tone:"sage",group:"Owner",description:"Manage Field Guide content",ownerOnly:true},
  {id:"home",label:"Home",href:"/app",icon:"home",tone:"sage",group:"Main",description:"Your PodScape homepage"},
  {id:"menu",label:"Menu",href:"/menu",icon:"menu",tone:"sand",group:"Main",description:"Explore all PodScape features"},
  {id:"search",label:"Search",href:"/search",icon:"search",tone:"sage",group:"Main",description:"Find species, products, guides and more"},
  {id:"account",label:"Account",href:"/account",icon:"community",tone:"sage",group:"Main",description:"Your profile, rewards and account settings"},
  {id:"shop",label:"Shop",href:"/shop",icon:"shop",tone:"sand",group:"Discover",description:"Browse the PodScape shop"},
  {id:"ledger",label:"Ledger",href:"/ledger",icon:"leaf",tone:"sage",group:"Discover",description:"Explore species in the Leaf Ledger"},
  {id:"guides",label:"Guides",href:"/field-guide",icon:"book",tone:"sage",group:"Discover",description:"Husbandry guides and resources"},
  {id:"collection",label:"My Collection",href:"/keeper/collection",icon:"jar",tone:"sage",group:"Keeper tools",description:"Your species, bins and colonies"},
  {id:"manager",label:"Manager",href:"/keeper",icon:"manager",tone:"sage",group:"Keeper tools",description:"Your colony manager dashboard"},
  {id:"scan",label:"Scan",href:"/keeper/scan",icon:"scan",tone:"sage",group:"Keeper tools",description:"Scan an enclosure QR code"},
  {id:"qr",label:"QR Creator",href:"/keeper/qr",icon:"qr",tone:"sage",group:"Keeper tools",description:"Create enclosure QR labels"},
  {id:"schedule",label:"Care Schedule",href:"/keeper/schedule",icon:"calendar",tone:"sage",group:"Keeper tools",description:"View your colony care schedule"},
  {id:"fun-zone",label:"Fun Zone",href:"/fun-zone",icon:"creative",tone:"rose",group:"Play & projects",description:"Puzzles, games and quizzes"},
  {id:"crossword-colony",label:"Crossword Colony",href:"/fun-zone/crossword-colony",icon:"book",tone:"rose",group:"Play & projects",description:"Isopod-themed crossword puzzles"},
  {id:"colony-connections",label:"Colony Connections",href:"/fun-zone/colony-connections",icon:"creative",tone:"rose",group:"Play & projects",description:"Find four hidden groups"},
  {id:"word-burrow",label:"Word Burrow",href:"/fun-zone/word-burrow",icon:"note",tone:"rose",group:"Play & projects",description:"Guess the isopod term"},
  {id:"species-detective",label:"Species Detective",href:"/fun-zone/species-detective",icon:"leaf",tone:"rose",group:"Play & projects",description:"Identify species from clues"},
  {id:"word-search",label:"Word Search",href:"/fun-zone/word-search",icon:"book",tone:"rose",group:"Play & projects",description:"Find hidden hobby terms"},
  {id:"keepers-challenge",label:"Keeper's Challenge",href:"/fun-zone/keepers-challenge",icon:"jar",tone:"rose",group:"Play & projects",description:"Practical colony scenario puzzles"},
  {id:"word-of-the-week",label:"Word of the Week",href:"/fun-zone/word-of-the-week",icon:"note",tone:"rose",group:"Play & projects",description:"Explore isopod vocabulary"},
  {id:"species-quiz",label:"Species Quiz",href:"/fun-zone/species-quiz",icon:"leaf",tone:"rose",group:"Play & projects",description:"Test your isopod knowledge"},
  {id:"podbound",label:"PodBound",href:"/podbound",icon:"podbound",tone:"sand",group:"Play & projects",description:"Original isopod strategy card game"},
  {id:"podbound-cards",label:"Card Catalogue",href:"/podbound/cards",icon:"podbound",tone:"sand",group:"Play & projects",description:"Browse published PodBound game cards"},
  {id:"progress",label:"My Progress",href:"/account/progress",icon:"leaf",tone:"sage",group:"Play & projects",description:"Achievements, levels and EXP"},
  {id:"community",label:"Community",href:"/community",icon:"community",tone:"sage",group:"Community & studio",description:"The PodScape keeper community"},
  {id:"lab",label:"Updates & Improvements",href:"/updates",icon:"news",tone:"rose",group:"Community & studio",description:"Published platform improvements and change notes"},
  {id:"explore",label:"Explore PodScape",href:"/explore",icon:"leaf",tone:"sage",group:"Community & studio",description:"A map of the PodScape ecosystem"},
  {id:"vendor-directory",label:"Vendor Directory",href:"/explore#vendor-directory",icon:"vendor",tone:"sand",group:"Coming later",description:"Future directory for hobby breeders and businesses",planned:true},
  {id:"creative-network",label:"Creative Network",href:"/explore#creative-network",icon:"creative",tone:"rose",group:"Coming later",description:"Future network for artists and makers",planned:true},
];
export const navigationGroups:NavGroup[]=["Main","Discover","Keeper tools","Play & projects","Community & studio","Coming later","Owner"];
export const initialBottom=["home","shop","scan","manager","menu"];
export const initialHome=["ledger","shop","fun-zone","community","guides","podbound"];
export const choiceById=new Map(navigationChoices.map(item=>[item.id,item]));
export function availableNavigationChoices(isOwner:boolean){return navigationChoices.filter(item=>isOwner||!item.ownerOnly)}
export type PreferenceArea="bottom"|"home";
export function cleanPreference(value:unknown,area:PreferenceArea,isOwner=false):string[]{
  const defaults=area==="bottom"?initialBottom:initialHome;
  const expected=defaults.length;
  if(!Array.isArray(value)||value.some(id=>typeof id!=="string"||!choiceById.has(id)||(!isOwner&&choiceById.get(id)?.ownerOnly))||new Set(value).size!==value.length)return [...defaults];
  // Restore a sixth slot without discarding existing five-slot preferences.
  if(area==="home"&&value.length===5)return [...value,...defaults.filter(id=>!value.includes(id))].slice(0,expected) as string[];
  if(area==="home"&&value.length!==expected){
    return [...value.slice(0,expected),...defaults.filter(id=>!value.includes(id))].slice(0,expected);
  }
  if(value.length!==expected)return [...defaults];
  return value as string[];
}
export function readPreference(area:PreferenceArea,isOwner=false):string[]{
  try{return cleanPreference(JSON.parse(localStorage.getItem("podscape-nav-v1-"+area)||"null"),area,isOwner)}
  catch{return area==="bottom"?[...initialBottom]:[...initialHome]}
}
export function writePreference(area:PreferenceArea,ids:string[],isOwner=false){
  const next=cleanPreference(ids,area,isOwner);
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
