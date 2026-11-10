import {cleanPreference,initialBottom,initialHome,type PreferenceArea} from "@/components/navigation-customization";

/** Persist only supported, non-sensitive UI settings. Never sync pins, user data, care logs or account details. */
export const HOME_KEY = "podscape-home-widgets-v2";
export const HOME_LEGACY_KEY = "podscape-home-widgets-v1";
export const homeOrder = ["greeting","hero","shortcuts","spotlight","recent","colony","games","progress","schedule","guides","community","pins"] as const;
const optionalWidgets = ["recent","colony","games","progress","schedule","guides","community","pins"] as const;
type HomeId = (typeof homeOrder)[number];
type WidgetId = (typeof optionalWidgets)[number];
export type UiPreferences = {
 home: {order:HomeId[];visible:WidgetId[]};
 navHome:string[];
 navBottom:string[];
};
export const defaultUiPreferences = ():UiPreferences => ({
 home:{order:[...homeOrder],visible:["recent"]},navHome:[...initialHome],navBottom:[...initialBottom]
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
 if(layout.order.length!==homeOrder.length||!homeOrder.every(id=>layout.order.includes(id)))return null;
 if(!layout.visible.every(id=>optionalWidgets.includes(id as WidgetId)))return null;
 if(!validNavigation(data.navHome,"home",isOwner)||!validNavigation(data.navBottom,"bottom",isOwner))return null;
 return {
  home:{order:layout.order as HomeId[],visible:layout.visible as WidgetId[]},
  navHome:[...data.navHome as string[]],navBottom:[...data.navBottom as string[]]
 };
}
function readLocalHome(){
 try{
  const current=localStorage.getItem(HOME_KEY);
  const value=JSON.parse(current||localStorage.getItem(HOME_LEGACY_KEY)||"null") as {order?:unknown;visible?:unknown}|null;
  if(!value||!uniqueStrings(value.order)||!uniqueStrings(value.visible))return defaultUiPreferences().home;
  const order=[...new Set([...value.order.filter(id=>(homeOrder as readonly string[]).includes(id)),...homeOrder])] as HomeId[];
  // The legacy layout stores optional widgets only; ignore invalid saved widget IDs.
  const visible=value.visible.filter(id=>(optionalWidgets as readonly string[]).includes(id)) as WidgetId[];
  return {order,visible};
 }catch{return defaultUiPreferences().home}
}
export function readLocalUiPreferences(isOwner=false):UiPreferences {
 const parseNav=(area:PreferenceArea)=>{
  try{return cleanPreference(JSON.parse(localStorage.getItem("podscape-nav-v1-"+area)||"null"),area,isOwner)}
  catch{return cleanPreference(null,area,isOwner)}
 };
 return {home:readLocalHome(),navHome:parseNav("home"),navBottom:parseNav("bottom")};
}
export function isDefaultUiPreferences(pref:UiPreferences){
 return JSON.stringify(pref)===JSON.stringify(defaultUiPreferences());
}
export function sameUiPreferences(a:UiPreferences,b:UiPreferences){
 return JSON.stringify(a)===JSON.stringify(b);
}
export function writeLocalUiPreferences(pref:UiPreferences,isOwner=false){
 const value=parseUiPreferences(pref,isOwner);
 if(!value)return false;
 try {
  const current=readLocalUiPreferences(isOwner);
  if(!sameUiPreferences(current,value)){
   if(JSON.stringify(current.home)!==JSON.stringify(value.home)){
    localStorage.setItem(HOME_KEY,JSON.stringify(value.home));
    window.dispatchEvent(new Event("podscape-home-widgets-changed"));
   }
   if(JSON.stringify(current.navHome)!==JSON.stringify(value.navHome)){
    localStorage.setItem("podscape-nav-v1-home",JSON.stringify(value.navHome));
    window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area:"home"}}));
   }
   if(JSON.stringify(current.navBottom)!==JSON.stringify(value.navBottom)){
    localStorage.setItem("podscape-nav-v1-bottom",JSON.stringify(value.navBottom));
    window.dispatchEvent(new CustomEvent("podscape-nav-updated",{detail:{area:"bottom"}}));
   }
  }
  return true;
 }catch{return false}
}
