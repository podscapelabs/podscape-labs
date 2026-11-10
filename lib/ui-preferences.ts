import {cleanPreference,initialBottom,initialHome,type PreferenceArea} from "@/components/navigation-customization";

/** Persist only supported, non-sensitive UI settings. Never sync pins, user data, care logs or account details. */
export const HOME_KEY = "podscape-home-widgets-v2";
export const HOME_LEGACY_KEY = "podscape-home-widgets-v1";
export const homeOrder = ["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins"] as const;
const optionalWidgets = ["recent","colony","games","progress","schedule","guides","community","pins"] as const;
type HomeId = (typeof homeOrder)[number];
type WidgetId = (typeof optionalWidgets)[number];
export const managerOrder = ["hero","tools","enclosures","care","activity","stats","insights"] as const;
export const managerTools = ["scan","qr","bulkqr","add","care","schedule","notes","colonies","history","activity"] as const;
export const speciesOrder = ["care","moisture","behaviour","habitatAdvanced","nutrition","breeding","taxonomy","about","traits","guides","sources","personal","navigation"] as const;
export type ManagerLayout = {order:(typeof managerOrder)[number][];visible:(typeof managerOrder)[number][];tools:string[]};
export type SpeciesLayout = {order:(typeof speciesOrder)[number][];visible:(typeof speciesOrder)[number][]};
export const defaultManagerLayout=():ManagerLayout=>({order:[...managerOrder],visible:["hero","tools","enclosures","care"],tools:["scan","care","colonies","add","schedule","qr"]});
export const defaultSpeciesLayout=():SpeciesLayout=>({order:[...speciesOrder],visible:["care","moisture","behaviour","habitatAdvanced","about","traits","personal","navigation"]});
export const managerStorageKey=(id:string)=>"podscape-manager-layout-v1:"+id;
export const speciesStorageKey=(id:string)=>"podscape-species-dashboard-v1:"+id;
function hasExactIds(value:unknown,valid:readonly string[]):value is string[]{
 return uniqueStrings(value)&&value.length===valid.length&&valid.every(id=>value.includes(id));
}
function validManager(value:unknown):value is ManagerLayout{
 if(!value||typeof value!=="object")return false;
 const v=value as Record<string,unknown>;
 return hasExactIds(v.order,managerOrder)&&uniqueStrings(v.visible)
  &&v.visible.every(id=>managerOrder.includes(id as ManagerLayout["order"][number]))
  &&v.visible.includes("hero")&&v.visible.includes("tools")
  &&uniqueStrings(v.tools)&&v.tools.length===6&&v.tools.every(id=>managerTools.includes(id as (typeof managerTools)[number]));
}
function validSpecies(value:unknown):value is SpeciesLayout{
 if(!value||typeof value!=="object")return false;
 const v=value as Record<string,unknown>;
 return hasExactIds(v.order,speciesOrder)&&uniqueStrings(v.visible)&&v.visible.every(id=>speciesOrder.includes(id as SpeciesLayout["order"][number]));
}
function readLocalWorkspace<T>(storageKey:string,valid:(v:unknown)=>v is T,fallback:()=>T):T{
 try{const raw=localStorage.getItem(storageKey);if(raw){const saved=JSON.parse(raw) as unknown;if(valid(saved))return saved}}catch{}
 return fallback();
}
export type UiPreferences = {
 home: {order:HomeId[];visible:WidgetId[]};
 navHome:string[];
 navBottom:string[];
 manager:ManagerLayout;
 species:SpeciesLayout;
};
export const defaultUiPreferences = ():UiPreferences => ({
 home:{order:[...homeOrder],visible:["recent"]},navHome:[...initialHome],navBottom:[...initialBottom],
 manager:defaultManagerLayout(),species:defaultSpeciesLayout()
});
function uniqueStrings(data:unknown):data is string[]{
 return Array.isArray(data) && data.every(value=>typeof value==="string") && new Set(data).size===data.length;
}
function validNavigation(value:unknown,area:PreferenceArea,isOwner:boolean){
 return uniqueStrings(value) && JSON.stringify(cleanPreference(value,area,isOwner)) === JSON.stringify(value);
}
export function parseUiPreferences(value:unknown,isOwner=false):UiPreferences|null {
 if(!value||typeof value!=="object")return null;
 const data=value as Record<string,unknown>,home=data.home;
 if(!home||typeof home!=="object")return null;
 const layout=home as Record<string,unknown>;
 if(!uniqueStrings(layout.order)||!uniqueStrings(layout.visible))return null;
 const requestedOrder=layout.order;
 if(requestedOrder.length!==homeOrder.length||!homeOrder.every(id=>requestedOrder.includes(id)))return null;
 if(!layout.visible.every(id=>optionalWidgets.includes(id as WidgetId)))return null;
 if(!validNavigation(data.navHome,"home",isOwner)||!validNavigation(data.navBottom,"bottom",isOwner))return null;
 const manager=data.manager===undefined?defaultManagerLayout():data.manager;
 const species=data.species===undefined?defaultSpeciesLayout():data.species;
 if(!validManager(manager)||!validSpecies(species))return null;
 return {
  home:{order:layout.order as HomeId[],visible:layout.visible as WidgetId[]},
  navHome:[...data.navHome as string[]],navBottom:[...data.navBottom as string[]],
  manager:{order:[...manager.order],visible:[...manager.visible],tools:[...manager.tools]},
  species:{order:[...species.order],visible:[...species.visible]}
 };
}
function readLocalHome(){
 try{
  const current=localStorage.getItem(HOME_KEY);
  const legacy=!current;
  const value=JSON.parse(current||localStorage.getItem(HOME_LEGACY_KEY)||"null") as {order?:unknown;visible?:unknown}|null;
  if(!value||!uniqueStrings(value.order)||!uniqueStrings(value.visible))return defaultUiPreferences().home;
  const oldOrder=value.order.filter(id=>(homeOrder as readonly string[]).includes(id));
  const order=(legacy
    ? [...new Set([...homeOrder.slice(0,4),...oldOrder,...homeOrder.slice(4)])]
    : [...new Set([...oldOrder,...homeOrder])]) as HomeId[];
  // The legacy layout stores optional widgets only; ignore invalid saved widget IDs.
  const visible=value.visible.filter(id=>(optionalWidgets as readonly string[]).includes(id)) as WidgetId[];
  return {order,visible};
 }catch{return defaultUiPreferences().home}
}
export function readLocalUiPreferences(isOwner=false,userId?:string|null):UiPreferences {
 const parseNav=(area:PreferenceArea)=>{
  try{return cleanPreference(JSON.parse(localStorage.getItem("podscape-nav-v1-"+area)||"null"),area,isOwner)}
  catch{return cleanPreference(null,area,isOwner)}
 };
 return {home:readLocalHome(),navHome:parseNav("home"),navBottom:parseNav("bottom"),
  manager:userId?readLocalWorkspace(managerStorageKey(userId),validManager,defaultManagerLayout):defaultManagerLayout(),
  species:userId?readLocalWorkspace(speciesStorageKey(userId),validSpecies,defaultSpeciesLayout):defaultSpeciesLayout()};
}
export function isDefaultUiPreferences(pref:UiPreferences){
 return JSON.stringify(pref)===JSON.stringify(defaultUiPreferences());
}
export function sameUiPreferences(a:UiPreferences,b:UiPreferences){
 return JSON.stringify(a)===JSON.stringify(b);
}
export function writeLocalUiPreferences(pref:UiPreferences,isOwner=false,userId?:string|null){
 const value=parseUiPreferences(pref,isOwner);
 if(!value)return false;
 try {
  const current=readLocalUiPreferences(isOwner,userId);
  if(!sameUiPreferences(current,value)){
   if(JSON.stringify(current.home)!==JSON.stringify(value.home)){
    localStorage.setItem(HOME_KEY,JSON.stringify(value.home));
    window.dispatchEvent(new Event("podscape-home-widgets-changed"));
   }
   if(JSON.stringify(current.navHome)!==JSON.stringify(value.navHome)){
    localStorage.setItem("podscape-nav-v1-home",JSON.stringify(value.navHome));
    window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area:"home"}}));
   }
   if(userId&&JSON.stringify(current.manager)!==JSON.stringify(value.manager)){
    localStorage.setItem(managerStorageKey(userId),JSON.stringify(value.manager));
    window.dispatchEvent(new CustomEvent("podscape-workspace-layout-changed",{detail:{area:"manager",userId}}));
   }
   if(userId&&JSON.stringify(current.species)!==JSON.stringify(value.species)){
    localStorage.setItem(speciesStorageKey(userId),JSON.stringify(value.species));
    window.dispatchEvent(new CustomEvent("podscape-workspace-layout-changed",{detail:{area:"species",userId}}));
   }
   if(JSON.stringify(current.navBottom)!==JSON.stringify(value.navBottom)){
    localStorage.setItem("podscape-nav-v1-bottom",JSON.stringify(value.navBottom));
    window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area:"bottom"}}));
   }
  }
  return true;
 }catch{return false}
}
