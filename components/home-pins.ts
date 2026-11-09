export type PinKind="species"|"colony"|"game";
export type HomePin={kind:PinKind;id:string};
export type PinOption=HomePin&{title:string;description:string;href:string};
const valid=(value:unknown):value is HomePin=>{
 if(!value||typeof value!=="object")return false;
 const p=value as Partial<HomePin>;
 return (p.kind==="species"||p.kind==="colony"||p.kind==="game")&&typeof p.id==="string"&&/^[a-z0-9-]{1,100}$/i.test(p.id);
};
export const pinsKey=(userId:string|null)=>"podscape-home-pins-v1-"+(userId||"guest");
export const pinKey=(p:HomePin)=>p.kind+":"+p.id;
export function readHomePins(userId:string|null):HomePin[]{
 try{const items:unknown=JSON.parse(localStorage.getItem(pinsKey(userId))||"[]");if(!Array.isArray(items))return[];return items.filter(valid).filter((p,i,a)=>a.findIndex(x=>pinKey(x)===pinKey(p))===i).slice(0,24)}catch{return[]}
}
export function writeHomePins(userId:string|null,pins:HomePin[]){
 try{localStorage.setItem(pinsKey(userId),JSON.stringify(pins));window.dispatchEvent(new CustomEvent("podscape-home-pins-changed",{detail:{userId}}))}catch{}
}
export function toggleHomePin(userId:string|null,pin:HomePin):boolean{
 if(!valid(pin))return false;
 const old=readHomePins(userId),present=old.some(p=>pinKey(p)===pinKey(pin));
 if(!present&&old.length>=24)return false;
 const next=present?old.filter(p=>pinKey(p)!==pinKey(pin)):[...old,pin];
 writeHomePins(userId,next);
 if(!present){
  // Pinning something automatically exposes the Favorites widget on Home.
  try{
   const key="podscape-home-widgets-v1";
   const data=JSON.parse(localStorage.getItem(key)||"null") as {order?:string[];visible?:string[]}|null;
   const order=Array.isArray(data?.order)?data.order:[];
   const visible=Array.isArray(data?.visible)?data.visible:["recent"];
   localStorage.setItem(key,JSON.stringify({order:order.includes("pins")?order:[...order,"pins"],visible:visible.includes("pins")?visible:[...visible,"pins"]}));
   window.dispatchEvent(new Event("podscape-home-widgets-changed"));
  }catch{}
 }
 return !present;
}
