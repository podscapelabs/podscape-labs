/** Editorial trait vocabulary, not an inferred numerical behaviour score.
 * Only use traits supported by the species or morph evidence.
 */
export const SPECIES_TRAIT_GROUPS=[
 {group:"Appearance",traits:[
  ["High-contrast pattern","Strong contrast between visible body markings."],
  ["Distinctive colouration","A recognized colour characteristic of the species or morph."],
  ["Spotted pattern","Visible spotted markings."],
  ["Striped pattern","Visible longitudinal striping."],
  ["Translucent body","A noticeably translucent body appearance."],
  ["Spiny body","Prominent dorsal spines or projections."],
  ["Large-bodied","Relatively large adult size compared with commonly kept isopods."],
  ["Small-bodied","Relatively small adult size compared with commonly kept isopods."],
  ["Pronounced sexual dimorphism","Adult males and females have conspicuous visible differences."]
 ]},
 {group:"Feeding",traits:[
  ["Strong protein appetite","Repeated captive-keeping observations of readily consuming protein-rich food. This does not prove a greater physiological protein requirement."]
 ]},
 {group:"Behaviour",traits:[
  ["Conglobates (rolls into a ball)","Can roll into a ball as a defensive response."],
  ["Frequently visible","Frequently observed on the surface under typical captive conditions."],
  ["Mostly concealed","Usually remains under shelter or substrate during ordinary observation."],
  ["Defensive hissing","Makes a documented audible defensive sound."],
  ["Climbing behaviour","Regularly climbs available enclosure surfaces or structures."],
  ["Burrowing behaviour","Regularly enters or excavates the substrate."]
 ]},
 {group:"Reproduction & development",traits:[
  ["Prolific breeder","Colonies are repeatedly reported to expand rapidly in appropriate captive conditions."],
  ["Slow colony growth","Generally slower colony expansion in captive reports."],
  ["Rapid colony growth","Generally rapid colony expansion in captive reports."],
  ["Distinctive juveniles","Young differ markedly in visible appearance from adults."],
  ["Notable colour variation","Recognized variation in colour within the species or morph."]
 ]},
 {group:"Hobby & identity",traits:[
  ["Captive-bred morph","Recognized, selectively maintained captive colour or pattern form."],
  ["Provisional identification","Identity is not yet confirmed at the claimed taxonomic rank."],
  ["Recognizable hobby morph","A widely recognized morph name or distinctive captive appearance."]
 ]}
] as const;
const TRAIT_IDS:Record<string,string>={
 "High-contrast pattern":"high-contrast-pattern",
 "Distinctive colouration":"distinctive-colouration",
 "Spotted pattern":"spotted-pattern",
 "Striped pattern":"striped-pattern",
 "Translucent body":"translucent-body",
 "Spiny body":"spiny-body",
 "Large-bodied":"large-bodied",
 "Small-bodied":"small-bodied",
 "Pronounced sexual dimorphism":"pronounced-sexual-dimorphism",
 "Strong protein appetite":"strong-protein-appetite",
 "Conglobates (rolls into a ball)":"conglobation",
 "Frequently visible":"frequently-visible",
 "Mostly concealed":"mostly-concealed",
 "Defensive hissing":"defensive-hissing",
 "Climbing behaviour":"climbing",
 "Burrowing behaviour":"burrowing",
 "Prolific breeder":"prolific-breeder",
 "Slow colony growth":"slow-colony-growth",
 "Rapid colony growth":"rapid-colony-growth",
 "Distinctive juveniles":"distinctive-juveniles",
 "Notable colour variation":"colour-variation",
 "Captive-bred morph":"captive-bred-morph",
 "Provisional identification":"provisional-identification",
 "Recognizable hobby morph":"recognizable-hobby-morph",
};
/** Stable canonical IDs power future species comparison; labels may evolve. */
export const SPECIES_TRAIT_REGISTRY=SPECIES_TRAIT_GROUPS.flatMap(group=>group.traits.map(([label,description])=>({
 id:TRAIT_IDS[label],label,description,group:group.group
})));
/** Explicit IDs are not derived from mutable display labels. */
export function getSpeciesTraitId(label:string):string|null{
 const match=SPECIES_TRAIT_REGISTRY.find(item=>item.label.toLocaleLowerCase("en")===label.trim().toLocaleLowerCase("en"));
 return match?.id??null;
}
/** Custom traits remain visible on profiles but do not silently become comparison categories. */
export function comparableTraitIds(labels:readonly string[]):string[]{
 return Array.from(new Set(labels.map(getSpeciesTraitId).filter((id):id is string=>id!==null))).sort();
}
export function normalizeSpeciesTrait(trait:string){
 return trait.trim().replace(/\\s+/g," ").slice(0,65);
}
