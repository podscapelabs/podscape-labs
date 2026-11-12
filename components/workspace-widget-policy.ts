/** Curated widget placement policy.
 * A widget is an interactive or glanceable unit, not a route shortcut.
 * Keep existing saved IDs stable. Groups organize libraries, not storage.
 */
export type WidgetPortal="home"|"manager"|"species"|"fun-zone";
type Placement={group:string;purpose:string;placement:"required"|"optional"};
export const widgetPlacement={
 home:{
  recent:{group:"Discover",purpose:"Recently updated content across PodScape",placement:"optional"},
  guides:{group:"Discover",purpose:"Continue reading field guides",placement:"optional"},
  pins:{group:"Discover",purpose:"Your saved species, games and colonies",placement:"optional"},
  colony:{group:"Keep",purpose:"Open your most recently updated colony",placement:"optional"},
  schedule:{group:"Keep",purpose:"Jump to the Manager care schedule",placement:"optional"},
  progress:{group:"Personal",purpose:"See your keeper level and EXP",placement:"optional"},
  games:{group:"Play",purpose:"Launch Fun Zone quickly",placement:"optional"},
  marketNews:{group:"Play",purpose:"Follow the latest fictional market headline",placement:"optional"},
  community:{group:"Discover",purpose:"Open the keeper community",placement:"optional"},
 },
 manager:{
  hero:{group:"Essentials",purpose:"Manager context and colony search",placement:"required"},
  tools:{group:"Essentials",purpose:"Optional shortcuts for extra keeper tools; direct care and bins stay available without them",placement:"optional"},
  enclosures:{group:"Your Colonies",purpose:"Recently updated enclosure list",placement:"optional"},
  stats:{group:"Your Colonies",purpose:"Colony and population totals",placement:"optional"},
  insights:{group:"Your Colonies",purpose:"Patterns from recorded colonies",placement:"optional"},
  care:{group:"Care & Activity",purpose:"Bins with care coming due",placement:"optional"},
  activity:{group:"Care & Activity",purpose:"Recent care history",placement:"optional"},
 },
 species:{
  care:{group:"Essentials",purpose:"Core husbandry at a glance",placement:"optional"},
  moisture:{group:"Essentials",purpose:"Moisture gradient and humidity",placement:"optional"},
  about:{group:"Essentials",purpose:"Compact species introduction",placement:"optional"},
  traits:{group:"Identification",purpose:"Distinctive species characteristics",placement:"optional"},
  taxonomy:{group:"Identification",purpose:"Names, origin and distribution",placement:"optional"},
  behaviour:{group:"Care & Biology",purpose:"Behavior, defenses and longevity",placement:"optional"},
  habitatAdvanced:{group:"Care & Biology",purpose:"Substrate, ventilation and habitat",placement:"optional"},
  nutrition:{group:"Care & Biology",purpose:"Diet and feeding considerations",placement:"optional"},
  breeding:{group:"Care & Biology",purpose:"Reproduction and development",placement:"optional"},
  guides:{group:"Explore Further",purpose:"Related guides for this species",placement:"optional"},
  sources:{group:"Explore Further",purpose:"Scientific references and research scope",placement:"optional"},
  personal:{group:"My Species",purpose:"Collection and pinning tools",placement:"optional"},
  navigation:{group:"My Species",purpose:"Continue exploring the catalogue",placement:"optional"}
 },
 "fun-zone":{
  rankings:{group:"My Arcade",purpose:"Swipe through Arcade, Lifetime EXP and three market leaderboards at a glance",placement:"optional"},
  featured:{group:"Discover Games",purpose:"Featured games and quick launches",placement:"optional"},
  categories:{group:"Discover Games",purpose:"Browse available games by type",placement:"optional"},
  favourites:{group:"My Arcade",purpose:"Launch saved favourite games",placement:"optional"},
  progress:{group:"My Arcade",purpose:"EXP and completed puzzles",placement:"optional"},
  exchange:{group:"Pod Exchange",purpose:"Fictional market watchlist only; trading stays in the Exchange",placement:"optional"},
 }
} as const satisfies Record<WidgetPortal,Record<string,Placement>>;
export const portalWidgetGroups={
 home:["Discover","Keep","Personal","Play"],
 manager:["Essentials","Your Colonies","Care & Activity"],
 species:["Essentials","Identification","Care & Biology","Explore Further","My Species"],
 "fun-zone":["Discover Games","My Arcade","Pod Exchange"]
} as const;
export function widgetAllowed(portal:WidgetPortal,id:string):boolean{
 return id in widgetPlacement[portal]||(portal==="fun-zone"&&id.startsWith("game:"));
}
export function widgetGroup(portal:WidgetPortal,id:string):string|null{
 if(portal==="fun-zone"&&id.startsWith("game:"))return "Pin a Game";
 const entries=widgetPlacement[portal] as Record<string,Placement>;
 return entries[id]?.group??null;
}
export function widgetPurpose(portal:WidgetPortal,id:string):string{
 const entries=widgetPlacement[portal] as Record<string,Placement>;
 return entries[id]?.purpose??"";
}
export function widgetRequired(portal:WidgetPortal,id:string):boolean{
 const entries=widgetPlacement[portal] as Record<string,Placement>;
 return entries[id]?.placement==="required";
}
