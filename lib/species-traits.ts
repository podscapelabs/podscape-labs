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
/** Do not reinterpret legacy generic feeding observations as protein-specific evidence. */
export const LEGACY_TRAIT_ALIASES:Record<string,string>={};
export function normalizeSpeciesTrait(trait:string){
 const tidy=trait.trim().replace(/\s+/g," ").slice(0,65);
 return LEGACY_TRAIT_ALIASES[tidy]||tidy;
}
