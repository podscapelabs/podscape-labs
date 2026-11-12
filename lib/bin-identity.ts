/** Display-only names: never rename a keeper's saved data automatically. */
export function binDisplayName(bin:{id:string;name:string;label?:string},species?:string){
 const name=/^primary (colony|enclosure|bin)$/i.test(bin.name.trim())?"Bin "+bin.id.slice(-6).toUpperCase():bin.name;
 return [species,name,bin.label].filter(Boolean).join(" · ");
}
