import {games,connectionGroups,crosswordClues,type Game,type GameKey,type Question} from "./fun-zone-games";

export type QuizPuzzle={id:string;title:string;description:string;difficulty:string;questions:Question[]};
export type BurrowPuzzle={id:string;title:string;description:string;difficulty:string;answer:string;clue:string;note:string};
export type ConnectionGroup={label:string;words:string[]};
export type ConnectionsPuzzle={id:string;title:string;description:string;difficulty:string;groups:ConnectionGroup[]};
export type CrosswordClue={answer:string;clue:string;r:number;c:number;dir:"across"|"down"};
export type CrosswordPuzzle={id:string;title:string;description:string;difficulty:string;clues:CrosswordClue[]};
export type SearchPuzzle={id:string;title:string;description:string;difficulty:string;words:string[];size:number;seed:number};
export type Puzzle=QuizPuzzle|BurrowPuzzle|ConnectionsPuzzle|CrosswordPuzzle|SearchPuzzle;
export type PuzzleMode=Game["mode"]|"search";
type Entry={gameKey:GameKey|"word-search";mode:PuzzleMode;puzzle:Puzzle};

const Q=(prompt:string,choices:string[],answer:number,explanation:string):Question=>({prompt,choices,answer,explanation});
const quiz=(id:string,title:string,description:string,difficulty:string,questions:Question[]):QuizPuzzle=>({id,title,description,difficulty,questions});
const burrow=(id:string,title:string,answer:string,clue:string,note:string,difficulty="Intro"):BurrowPuzzle=>({id,title,description:"Guess the five-letter term using its precise clue.",difficulty,answer,clue,note});
const group=(label:string,words:string[]):ConnectionGroup=>({label,words});
const connections=(id:string,title:string,groups:ConnectionGroup[]):ConnectionsPuzzle=>({id,title,description:"Find four groups of four related terms.",difficulty:"Medium",groups});
const crossword=(id:string,title:string,clues:CrosswordClue[]):CrosswordPuzzle=>({id,title,description:"Solve intersecting clues about isopod biology and care.",difficulty:"Medium",clues});
const search=(id:string,title:string,words:string[],seed:number,description="Find eight accurately named isopod terms."):SearchPuzzle=>({id,title,description,difficulty:"Medium",words,size:16,seed});
// The original crossword uses this carefully checked 7×6 grid.
const originalCrossword:CrosswordClue[]=crosswordClues.map((c,i)=>({...c,...([
 {r:6,c:1,dir:"across"},{r:1,c:3,dir:"down"},{r:3,c:2,dir:"down"},
 {r:4,c:0,dir:"across"},{r:2,c:2,dir:"across"}
] as const)[i]}));
// For new puzzles use a validated single-column vertical spine and crossing
// horizontal words, generated from a common letter. Every intersection matches.
// Each row of a spine crossword may also intersect neighbouring across rows.
// Keep an explicit checker to reject any contradictory intersection.
function validateCrossword(clues:CrosswordClue[]){
 const used=new Map<string,string>();const rows=8,cols=11;
 for(const c of clues){
  if(!/^[A-Z]+$/.test(c.answer))throw new Error("Invalid crossword answer");
  for(let i=0;i<c.answer.length;i++){
   const r=c.r+(c.dir==="down"?i:0),col=c.c+(c.dir==="across"?i:0),key=r+":"+col;
   if(r<0||col<0||r>=rows||col>=cols||used.has(key)&&used.get(key)!==c.answer[i])throw new Error("Crossword crossing mismatch "+key);
   used.set(key,c.answer[i]);
  }
 }
}
const extra:Entry[]=[
 ...[
 quiz("field-marks","Patterns & Identification","Identify familiar, commonly kept morphs.","Intro",[
 Q("Which isopod has a striped appearance that inspires its common name?",["Armadillidium maculatum (Zebra)","Porcellio hoffmannseggi (Titan)","Cubaris sp. ‘Rubber Ducky’","Porcellionides pruinosus (Powder Blue)"],0,"Zebra isopods are Armadillidium maculatum, often showing prominent pale longitudinal stripes."),
 Q("The hobby name 'Dairy Cow' describes which feature?",["Black-and-white patches","Bright blue legs","An elongated tail","A yellow head"],0,"This hobby morph is recognizable by contrasting black-and-white markings."),
 Q("Which species is commonly called the Clown isopod?",["Armadillidium klugii","Oniscus asellus","Porcellio dilatatus","Armadillidium gestroi"],0,"Armadillidium klugii is sold under the hobby name Clown."),
 Q("What should you use alongside colour when identifying unfamiliar isopods?",["Body shape and reliable taxonomic characters","Only the seller's photograph","Only the substrate colour","Only enclosure temperature"],0,"Colour varies across individuals and morphs; identification should consider morphology and reliable references.")
 ]),
 quiz("taxonomy-desk","Names & Classification","Match species names to their correct group.","Medium",[
 Q("Which genus contains Porcellio scaber?",["Porcellio","Cubaris","Armadillidium","Oniscus"],0,"The genus is the first part of the scientific binomial: Porcellio scaber."),
 Q("In Armadillidium klugii, what does 'klugii' denote?",["The specific epithet","The genus","An enclosure type","A colour standard"],0,"The second element is the specific epithet; together with the genus it forms the species name."),
 Q("Which name denotes a genus rather than a species?",["Oniscus","Porcellio scaber","Armadillidium maculatum","Porcellio dilatatus"],0,"Oniscus is a genus; the other options are binomial species names."),
 Q("What does 'sp.' indicate after a genus name?",["An unidentified or unspecified species in that genus","A confirmed subspecies","A colour morph","An extinct species"],0,"The abbreviation sp. means a species within the stated genus has not been specified.")
 ]),
 quiz("compare-the-keepers","Species Comparisons","Compare common hobby species without relying only on colour.","Medium",[
 Q("Which of these isopods is especially well known for its large adult size?",["Porcellio hoffmannseggi","Trichorhina tomentosa","Cubaris sp. ‘Papaya’","Porcellionides pruinosus"],0,"Porcellio hoffmannseggi is among the larger terrestrial isopods commonly maintained in captivity."),
 Q("Which species is the Zebra isopod?",["Armadillidium maculatum","Armadillidium klugii","Oniscus asellus","Porcellio laevis"],0,"Armadillidium maculatum is widely known as the Zebra isopod."),
 Q("Which commonly kept isopod is often sold as Powder Orange?",["Porcellionides pruinosus","Porcellio dilatatus","Armadillidium gestroi","Oniscus asellus"],0,"Powder Orange is a common hobby morph of Porcellionides pruinosus."),
 Q("How should a keeper interpret hobby names such as 'Titan' or 'Clown'?",["As informal names to verify against scientific identification","As formal taxonomic ranks","As always indicating a new species","As universal evidence of origin"],0,"Hobby names are useful labels but do not replace careful species-level identification.")
 ])
 ].map(p=>({gameKey:"species-detective" as const,mode:"quiz" as const,puzzle:p})),
 ...[
 quiz("humidity-check","The Moisture Check","Make careful, species-aware moisture decisions.","Intro",[
 Q("One corner is dry but the moist refuge is suitable. What should you do first?",["Assess the species' gradient needs before changing anything","Soak every corner","Seal every vent","Remove all cork"],0,"Different species use different gradients; a dry zone may be intentional."),
 Q("The moist refuge has become fully dry. What is a reasonable response?",["Rehydrate the refuge gradually","Wait indefinitely","Add only protein","Remove all substrate"],0,"A dependable moist refuge is important for many terrestrial isopods."),
 Q("Why can a permanently waterlogged enclosure be problematic?",["It can limit suitable aerated and drier areas","It prevents every mould species","It eliminates all care needs","It guarantees successful breeding"],0,"Waterlogged substrate can reduce aeration and remove useful moisture choices."),
 Q("Why should care recommendations vary by species?",["Species differ in ecology and moisture requirements","All isopods share identical habitats","Species names determine only colour","Ventilation never matters"],0,"Husbandry should account for the ecology and observed needs of each species.")
 ]),
 quiz("feeding-decisions","The Feeding Bench","Manage food responsibly in an enclosure.","Medium",[
 Q("A piece of fresh vegetable is rotting and remains uneaten. What is sensible?",["Remove it and offer a smaller portion next time","Add more on top","Stop providing leaf litter","Seal the lid permanently"],0,"Removing decomposing perishables can help manage pests and excess mould."),
 Q("What commonly serves as a staple food source for many terrestrial isopods?",["Decaying leaf litter","Only fresh fruit","Only live insects","Only mineral powder"],0,"Decaying plant litter is an important food source for many species."),
 Q("Which is a practical calcium source in many colonies?",["Cuttlebone","Plastic mesh","Untreated glass","Cotton fabric"],0,"Cuttlebone is commonly used as a supplemental calcium source."),
 Q("What is the best reason to avoid large amounts of uneaten perishable food?",["It may spoil and encourage unwanted growth","It changes the genus","It stops all moulting","It makes water unnecessary"],0,"Excess perishables can spoil before a colony consumes them.")
 ]),
 quiz("troubleshooting","Reading the Colony","Use observations before drawing conclusions.","Medium",[
 Q("You spot a single dead isopod. What is the most responsible first step?",["Check conditions and monitor for a pattern","Assume an infectious outbreak","Discard all cultures immediately","Stop all feeding"],0,"One death alone is not enough to diagnose its cause."),
 Q("Which observation may suggest a moisture problem?",["Individuals persistently crowding the only damp refuge","A juvenile feeding on leaves","An individual hiding beneath bark","A shed exoskeleton"],0,"Persistent crowding can suggest the rest of the gradient is unsuitable, though other causes are possible."),
 Q("Why is gradual adjustment often preferable to repeated major changes?",["It helps the keeper interpret the colony's response","It prevents all disease","It makes ventilation irrelevant","It permanently eliminates stress"],0,"Changing fewer variables at once makes observations more useful."),
 Q("What should you do when care advice conflicts?",["Check credible species-specific sources and observe the colony","Choose the wettest advice automatically","Use the highest temperature quoted","Ignore all context"],0,"Care depends on the species, setup and conditions; cross-checking sources is valuable.")
 ])
 ].map(p=>({gameKey:"keepers-challenge" as const,mode:"quiz" as const,puzzle:p})),
 ...[
 quiz("manca","Meet the Manca","Learn juvenile development terms.","Intro",[
 Q("What is a manca?",["An early juvenile isopod","An adult female only","A genus","A fungal spore"],0,"Mancae are juvenile stages of isopods and other peracarid crustaceans."),
 Q("Where do developing embryos of female terrestrial isopods remain?",["In a ventral brood pouch","In a hanging silk nest","Inside cork bark","In open standing water"],0,"Females brood developing offspring in a ventral marsupium."),
 Q("What is the marsupium?",["The brood pouch","An antenna segment","A feeding mouthpart","A soil layer"],0,"In peracarid crustaceans, the marsupium is a brood pouch carried by the female."),
 Q("Why should a keeper avoid unnecessary disturbance around young mancae?",["Very small juveniles may be delicate","It changes their species","They require dry air","They cannot eat leaf litter"],0,"Gentle handling and stable conditions reduce unnecessary disturbance.")
 ]),
 quiz("body-parts","Anatomy Essentials","Put names to the structures you see.","Medium",[
 Q("What are antennae primarily used for?",["Sensing the environment","Storing eggs","Replacing the legs","Producing substrate"],0,"Antennae are important sensory appendages."),
 Q("What is the pereon?",["The main thoracic body region","The underside of cork bark","A juvenile morph","A fungal structure"],0,"The pereon is the thoracic trunk region of an isopod."),
 Q("What is the pleon?",["The abdominal body region","A type of leaf","A breathing enclosure","A food supplement"],0,"The pleon is the abdominal region."),
 Q("Where are uropods located?",["Toward the posterior end","At the antenna tips","Above the eyes","Inside the stomach"],0,"Uropods are paired posterior appendages.")
 ]),
 quiz("molting","The Moult","Understand growth and the exoskeleton.","Medium",[
 Q("What is an exuvia?",["A shed exoskeleton","A moisture gauge","A genus name","A breeding enclosure"],0,"An exuvia is the cast-off outer skeleton after moulting."),
 Q("What is moulting?",["Shedding the old exoskeleton to permit growth","Losing antennae permanently","Changing genus","Producing leaf litter"],0,"Arthropods grow by periodically shedding their rigid cuticle."),
 Q("How do many isopods moult?",["In two main phases","By shedding all their legs together","Only once in life","Without an exoskeleton"],0,"Many isopods undergo biphasic moulting: posterior and anterior halves are shed at different times."),
 Q("Why might a shed exoskeleton disappear from a colony?",["Isopods may consume it","It always turns into mould","It dissolves immediately in dry air","It becomes a new juvenile"],0,"Isopods may consume moulted exoskeletons and recycle some of their minerals.")
 ])
 ].map(p=>({gameKey:"word-of-the-week" as const,mode:"quiz" as const,puzzle:p})),
 ...[
 quiz("forest-floor","Life in the Leaf Litter","Explore detritivores and decomposition.","Intro",[
 Q("What is detritus?",["Dead organic material","Only living prey","A new genus","An adult breeding stage"],0,"Detritus includes dead organic matter such as fallen plant material."),
 Q("What is a detritivore?",["An organism that feeds on detritus","An organism that feeds only on live leaves","An aquatic vertebrate","A type of mineral"],0,"Detritivores consume dead organic matter."),
 Q("What is one ecological role of terrestrial isopods?",["Fragmenting decaying organic material","Producing sunlight","Fixing atmospheric nitrogen directly","Replacing all decomposer microbes"],0,"Many terrestrial isopods help process leaf litter and other detritus."),
 Q("Which organisms commonly work alongside detritivores in decomposition?",["Fungi and bacteria","Only birds","Only mammals","Only flowering plants"],0,"Microorganisms break down organic matter alongside larger detritivores.")
 ]),
 quiz("respiration","Living on Land","Learn why suitable microhabitats matter.","Medium",[
 Q("Which appendages bear respiratory structures in many terrestrial isopods?",["Pleopods","Antennae","Mandibles","Walking claws"],0,"Respiratory structures are associated with modified abdominal pleopods."),
 Q("Why can humidity be important to many terrestrial isopods?",["It helps maintain suitable conditions for respiration and water balance","It replaces oxygen","It prevents every pathogen","It eliminates all temperature needs"],0,"Moisture conditions influence respiratory function and water balance."),
 Q("Why should an enclosure have appropriate ventilation?",["For gas exchange and moisture regulation","To eliminate all humidity","To prevent any food decay","To replace substrate"],0,"Ventilation helps manage gas exchange and excess condensation."),
 Q("Are moisture needs identical across all terrestrial isopods?",["No; ecology and species differ","Yes; all need complete saturation","Yes; all require total dryness","No; none require moisture"],0,"Terrestrial isopods vary in habitat preferences and tolerance.")
 ]),
 quiz("classification","The Crustacean Connection","Explore where isopods fit in animal classification.","Medium",[
 Q("Isopods are classified as which animals?",["Crustaceans","Insects","Arachnids","Molluscs"],0,"Isopods are crustaceans."),
 Q("What is the order containing isopods called?",["Isopoda","Araneae","Coleoptera","Gastropoda"],0,"Isopoda is the crustacean order that includes terrestrial and aquatic isopods."),
 Q("What does a genus name represent?",["A taxonomic grouping of related species","A standardized colour code","A substrate layer","An individual's age"],0,"A genus groups species in biological classification."),
 Q("Why should scientific names be checked against current references?",["Classification and identifications can change","Species never change names","Hobby nicknames are always taxonomic","Scientific names describe humidity"],0,"Taxonomic understanding and naming can be revised with new evidence.")
 ])
 ].map(p=>({gameKey:"species-quiz" as const,mode:"quiz" as const,puzzle:p})),
 ...[
 burrow("leaf-matter","Leaf Matter","HUMUS","Dark, well-decomposed organic matter in soil.","Humus is extensively decomposed organic material."),
 burrow("shelter","Find Cover","COVER","Protection provided by leaves, bark or other sheltered surfaces.","Leaf litter and bark provide cover and microhabitats."),
 burrow("decomposers","Decomposer Clue","FUNGI","A plural term for organisms that help break down dead material.","Fungi participate in decomposition.")
 ].map(p=>({gameKey:"word-burrow" as const,mode:"burrow" as const,puzzle:p})),
 ...[
 connections("parts-and-places","Anatomy & Habitats",[
 group("Body regions",["Pereon","Pleon","Cephalon","Pleotelson"]),
 group("Body appendages",["Antennae","Uropods","Pleopods","Pereopods"]),
 group("Forest-floor materials",["Leaf litter","Decaying wood","Humus","Cork bark"]),
 group("Care equipment",["Sprayer","Hygrometer","Thermometer","Vent lid"])
 ]),
 connections("names-and-needs","Species & Care",[
 group("Genera",["Porcellio","Oniscus","Cubaris","Armadillidium"]),
 group("Common hobby names",["Dairy Cow","Powder Blue","Rubber Ducky","Clown"]),
 group("Care concepts",["Moist refuge","Ventilation","Moisture gradient","Calcium source"]),
 group("Food materials",["Decaying leaves","Vegetable scraps","Fish food","Rotten wood"])
 ]),
 connections("life-in-litter","Life in the Litter",[
 group("Life stages or processes",["Manca","Adult","Moult","Brooding"]),
 group("Body structures",["Antenna","Uropod","Pereon","Pleon"]),
 group("Habitat items",["Bark","Leaf litter","Soil","Moss"]),
 group("Keeper observations",["Condensation","Activity","Feeding","Population"])
 ])
 ].map(p=>({gameKey:"colony-connections" as const,mode:"connections" as const,puzzle:p})),
 // Crossword clues are positioned explicitly, validated when loaded.
 crossword("anatomy-clues","Anatomy Terms",[
 {answer:"PLEON",clue:"The abdominal region of an isopod (5)",r:0,c:3,dir:"down"},
 {answer:"PEREON",clue:"The main thoracic body region (6)",r:0,c:3,dir:"across"},
 {answer:"LEAF",clue:"Fallen plant material commonly consumed by isopods (4)",r:1,c:3,dir:"across"},
 {answer:"EXUVIA",clue:"A shed exoskeleton (6)",r:2,c:3,dir:"across"},
 {answer:"ONISCUS",clue:"A genus of terrestrial isopods (7)",r:3,c:3,dir:"across"}
 ]),
 crossword("forest-words","The Forest Floor",[
 {answer:"MOSS",clue:"A non-vascular plant sometimes used as a moist refuge (4)",r:0,c:4,dir:"down"},
 {answer:"MANCa".toUpperCase(),clue:"A juvenile stage in isopod development (5)",r:0,c:4,dir:"across"},
 {answer:"ONISCUS",clue:"An isopod genus (7)",r:1,c:4,dir:"across"},
 {answer:"SOIL",clue:"Ground material that may form part of substrate (4)",r:2,c:4,dir:"across"},
 {answer:"SUBSTRATE",clue:"Material lining the floor of an enclosure (9)",r:3,c:4,dir:"across"}
 ]),
 crossword("keeper-words","The Keeper's Kit",[
 {answer:"CARE",clue:"Attention given to captive animals (4)",r:0,c:3,dir:"down"},
 {answer:"CORK",clue:"Bark material often used as a hide (4)",r:0,c:3,dir:"across"},
 {answer:"AIR",clue:"A mixture of gases exchanged through ventilation (3)",r:1,c:3,dir:"across"},
 {answer:"REFUGE",clue:"A sheltered place (6)",r:2,c:3,dir:"across"},
 {answer:"ENCLOSURE",clue:"A container housing a captive colony (9)",r:3,c:3,dir:"across"}
 ])
 ].map(p=>({gameKey:"crossword-colony" as const,mode:"crossword" as const,puzzle:p})),
 ...[
 search("leaf-litter","Leaf Litter Basics",["LEAF","LITTER","HUMUS","DECAY","FUNGI","SOIL","BARK","MOSS"],19737,"Find forest-floor and decomposer terms."),
 search("keeper-essentials","Keeper Essentials",["MOISTURE","FEEDING","CALCIUM","VENTILATION","SUBSTRATE","SPRAYER","ENCLOSURE","HUMIDITY"],81927,"Find familiar enclosure and husbandry terms."),
 search("anatomy-terms","Anatomy Terms",["ANTENNA","PEREON","PLEON","UROPOD","PLEOPOD","EXUVIA","MANCA","MARSUPIUM"],34987,"Find scientifically defined isopod anatomy and development terms.")
 ].map(p=>({gameKey:"word-search" as const,mode:"search" as const,puzzle:p}))
];
const sample:Entry[]=[
 ...games.map(game=>({
 gameKey:game.key,mode:game.mode,
 puzzle:game.mode==="quiz"?quiz("sample-01",game.puzzleTitle,game.description,"Intro",game.questions||[])
 :game.mode==="burrow"?burrow("sample-01",game.puzzleTitle,"HUMUS","Dark, decomposed organic material in soil.","Humus is well-decomposed organic material.")
 :game.mode==="connections"?connections("sample-01",game.puzzleTitle,connectionGroups)
 :crossword("sample-01",game.puzzleTitle,originalCrossword)
 } as Entry)),
 {gameKey:"word-search",mode:"search",puzzle:search("genus-explorer","Genus Explorer",["CUBARIS","PORCELLIO","ARMADILLIDIUM","PORCELLIONIDES","TRICHORHINA","ONISCUS","PHILOSCIA","NAGURUS"],24681357,"Find eight isopod genera.")}
];
export const puzzleEntries:Entry[]=[...sample,...extra];
export function getPuzzles(gameKey:string){return puzzleEntries.filter(e=>e.gameKey===gameKey);}
export function getPuzzle(gameKey:string,puzzleId:string){return puzzleEntries.find(e=>e.gameKey===gameKey&&e.puzzle.id===puzzleId);}
export const gameKeys=[...games.map(g=>g.key),"word-search"] as const;
// Fail early if content is malformed; no runtime puzzle should be unsolvable.
for(const e of puzzleEntries){
 if(e.mode==="crossword")validateCrossword((e.puzzle as CrosswordPuzzle).clues);
 if(e.mode==="quiz"){
  const questions=(e.puzzle as QuizPuzzle).questions;
  if(!questions.length||questions.some(q=>q.choices.length!==4||q.answer<0||q.answer>3||!q.explanation.trim()))throw new Error("Invalid quiz "+e.puzzle.id);
 }
 if(e.mode==="connections"){
  const groups=(e.puzzle as ConnectionsPuzzle).groups,words=groups.flatMap(g=>g.words);
  if(groups.length!==4||groups.some(g=>g.words.length!==4)||new Set(words).size!==16)throw new Error("Invalid groups "+e.puzzle.id);
 }
 if(e.mode==="burrow"&&!/^[A-Z]{5}$/.test((e.puzzle as BurrowPuzzle).answer))throw new Error("Invalid word "+e.puzzle.id);
 if(e.mode==="search"){
  const p=e.puzzle as SearchPuzzle;
  if(p.words.length!==8||p.words.some(w=>!/^[A-Z]+$/.test(w)||w.length>p.size))throw new Error("Invalid search "+e.puzzle.id);
 }
}
for(const key of gameKeys)if(getPuzzles(key).length!==4)throw new Error("Expected 4 puzzles in "+key);
