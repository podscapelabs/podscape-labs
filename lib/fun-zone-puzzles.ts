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
// Deterministic choice rotation prevents "the first answer is always right"
 // without changing question IDs or making the quiz non-reproducible.
const quiz=(id:string,title:string,description:string,difficulty:string,questions:Question[]):QuizPuzzle=>({
 id,title,description,difficulty,questions:questions.map((q,index)=>{
  const shift=([...q.prompt].reduce((n,ch)=>(n+ch.charCodeAt(0))%97,index)%4);
  return {...q,choices:[...q.choices.slice(4-shift),...q.choices.slice(0,4-shift)],answer:(q.answer+shift)%4};
 })
});
const burrow=(id:string,title:string,answer:string,clue:string,note:string,difficulty="Intro"):BurrowPuzzle=>({id,title,description:"Guess the five-letter term using its precise clue.",difficulty,answer,clue,note});
const group=(label:string,words:string[]):ConnectionGroup=>({label,words});
const connections=(id:string,title:string,groups:ConnectionGroup[]):ConnectionsPuzzle=>({id,title,description:"Find four groups of four related terms.",difficulty:"Medium",groups});
const crossword=(id:string,title:string,clues:CrosswordClue[]):CrosswordPuzzle=>({id,title,description:"Solve intersecting clues about isopod biology and care.",difficulty:"Medium",clues});
const search=(id:string,title:string,words:string[],seed:number,description="Find eight accurately named isopod terms."):SearchPuzzle=>({id,title,description,difficulty:"Medium",words,size:16,seed});
// Connected mini-crosswords: every run of two or more adjacent letters
// must match exactly one clued entry. This catches ghost words like CHIDE.
const originalCrossword:CrosswordClue[]=crosswordClues.map((c,i)=>({
 ...c,...(i===3?{answer:"HOLES",clue:"Small openings that help air flow through an enclosure (5)"}:{}),
 ...([
  {r:6,c:0,dir:"across"},{r:0,c:5,dir:"down"},
  {r:3,c:1,dir:"down"},{r:3,c:1,dir:"across"},
  {r:1,c:4,dir:"across"}
 ] as const)[i]
}));
function validateCrossword(clues:CrosswordClue[]){
 const cells=new Map<string,string>(),entries=new Set<string>();
 for(const clue of clues){
  if(!/^[A-Z]{2,}$/.test(clue.answer)||!clue.clue.includes("("+clue.answer.length+")"))
   throw new Error("Invalid crossword entry");
  const entry=clue.dir+":"+clue.r+":"+clue.c+":"+clue.answer;
  if(entries.has(entry))throw new Error("Duplicate crossword entry");
  entries.add(entry);
  for(let i=0;i<clue.answer.length;i++){
   const r=clue.r+(clue.dir==="down"?i:0),c=clue.c+(clue.dir==="across"?i:0),key=r+":"+c;
   if(r<0||c<0||r>=8||c>=13||cells.has(key)&&cells.get(key)!==clue.answer[i])
    throw new Error("Crossword crossing mismatch "+key);
   cells.set(key,clue.answer[i]);
  }
 }
 const discovered=new Set<string>();
 for(const dir of ["across","down"] as const){
  const dr=dir==="down"?1:0,dc=dir==="across"?1:0;
  for(const key of cells.keys()){
   const [r,c]=key.split(":").map(Number);
   if(cells.has((r-dr)+":"+(c-dc)))continue;
   let word="",rr=r,cc=c;
   while(cells.has(rr+":"+cc)){
    word+=cells.get(rr+":"+cc);rr+=dr;cc+=dc;
   }
   if(word.length<2)continue;
   const entry=dir+":"+r+":"+c+":"+word;
   if(!entries.has(entry))throw new Error("Unclued crossword word "+entry);
   discovered.add(entry);
  }
 }
 if(discovered.size!==entries.size)throw new Error("Missing crossword entry");
 const positions=clues.map(clue=>new Set(Array.from({length:clue.answer.length},(_,i)=>
  (clue.r+(clue.dir==="down"?i:0))+":"+(clue.c+(clue.dir==="across"?i:0)))));
 const connected=new Set([0]);
 while(true){
  const size=connected.size;
  for(let i=0;i<clues.length;i++)if(!connected.has(i)&&[...connected].some(j=>
    [...positions[i]].some(pos=>positions[j].has(pos))))connected.add(i);
  if(connected.size===size)break;
 }
 if(connected.size!==clues.length)throw new Error("Disconnected crossword grid");
}
const extra:Entry[]=[
 ...[
 quiz("field-marks","Patterns & Identification","Identify familiar, commonly kept morphs.","Intro",[
 Q("Which familiar hobby morph has a warm orange, powdery appearance?",["Powder Orange","Rubber Ducky","Clown","Dairy Cow"],0,"Powder Orange is a colour morph commonly associated with Porcellionides pruinosus."),
 Q("What makes a colour morph recognizable within a species?",["Consistent appearance differences such as markings","A completely different number of legs","A different taxonomic order","An enclosure with extra bark"],0,"Morphs can show recognizable appearance differences, but remain members of the same species."),
 Q("Which species is commonly called the Clown isopod?",["Armadillidium klugii","Oniscus asellus","Porcellio dilatatus","Armadillidium gestroi"],0,"Armadillidium klugii is sold under the hobby name Clown."),
 Q("What should you use alongside colour when identifying unfamiliar isopods?",["Body shape and reliable taxonomic characters","Only the seller's photograph","Only the substrate colour","Only enclosure temperature"],0,"Colour varies across individuals and morphs; identification should consider morphology and reliable references.")
 ]),
 quiz("taxonomy-desk","Reading a Species Name","A gentle introduction to scientific labels.","Medium",[
 Q("In a scientific name like Porcellio scaber, which word is the genus?",["Porcellio","scaber","Both words combined","Neither word"],0,"The genus is the first word. Here it is Porcellio, and scaber is the specific epithet."),
 Q("In Armadillidium klugii, which word comes after the genus?",["klugii","Armadillidium","Both words are genera","No second word is used"],0,"klugii is called a specific epithet. Together with Armadillidium it makes the two-part species name."),
 Q("Which name denotes a genus rather than a species?",["Oniscus","Porcellio scaber","Armadillidium maculatum","Porcellio dilatatus"],0,"Oniscus is a genus; the other options are binomial species names."),
 Q("Which of these looks like a two-part scientific species name?",["Porcellio scaber","Powder Blue","Rubber Ducky","Dairy Cow"],0,"A binomial species name contains a genus followed by a specific epithet. This example is Porcellio scaber."),
 ]),
 quiz("compare-the-keepers","Species Comparisons","Compare common hobby species without relying only on colour.","Medium",[
 Q("Which of these isopods is especially well known for its large adult size?",["Porcellio hoffmannseggi","Trichorhina tomentosa","Cubaris sp. ‘Papaya’","Porcellionides pruinosus"],0,"Porcellio hoffmannseggi is among the larger terrestrial isopods commonly maintained in captivity."),
 Q("Which scientific species is often sold as Giant Canyon?",["Porcellio dilatatus","Armadillidium klugii","Oniscus asellus","Porcellio laevis"],0,"Porcellio dilatatus is a relatively large-bodied species commonly sold as Giant Canyon."),
 Q("Which pair are two colour morphs often associated with the same species?",["Powder Blue and Powder Orange","Zebra and Giant Canyon","Clown and Titan","Rubber Ducky and Dairy Cow"],0,"Powder Blue and Powder Orange are both common hobby morphs associated with Porcellionides pruinosus."),
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
 quiz("manca","Young Isopods","Meet baby isopods and learn one new life-stage term.","Intro",[
 Q("A very young isopod is called a juvenile. What does juvenile mean?",["A young animal","An adult male","An enclosure material","A colour morph"],0,"Juvenile simply means young. You'll see it often in keeper notes."),
 Q("What is the term manca used for?",["An early juvenile isopod","A piece of leaf litter","A type of humidity gauge","An adult male only"],0,"A manca is a very early juvenile stage in isopod development."),
 Q("Where does a female isopod carry her developing young?",["In a brood pouch beneath her body","On a silk thread","Under a leaf she never touches","In a water-filled nest"],0,"Many isopods carry embryos in a brood pouch. Scientists call this pouch a marsupium."),
 Q("What is helpful when you notice tiny young isopods?",["Keep conditions stable and handle gently","Dry every refuge immediately","Remove all shelter","Change the setup daily"],0,"Very small young may be delicate. Consistent, species-appropriate conditions are important.")
 ]),
 quiz("body-parts","The Parts You Can See","Learn anatomy by recognizing familiar body features first.","Medium",[
 Q("What are antennae primarily used for?",["Sensing the environment","Storing eggs","Replacing the legs","Producing substrate"],0,"Antennae are important sensory appendages."),
 Q("What is an exoskeleton?",["The hard outer body covering","A type of food","A breeding box","The soil layer"],0,"An exoskeleton is a protective outer skeleton. Isopods shed it when they moult."),
 Q("What happens to the outer covering during a moult?",["It is shed","It becomes a new species","It turns into a leaf","It disappears from every enclosure"],0,"The shed outer skeleton is called an exuvia. Many isopods may eat it afterward."),
 Q("What does posterior mean when describing an isopod?",["Toward the rear","Toward the head","Above the animal","Inside its food"],0,"Posterior means toward the back end. Scientists use this word when describing structures such as uropods."),
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
 Q("The word pleopods names appendages on an isopod’s abdomen. Where are they found?",["On the abdomen","At the antenna tips","Only inside the mouth","At the front of each eye"],0,"Pleopods are abdominal appendages. In many terrestrial isopods, specialized respiratory structures are associated with them."),
 Q("Why can humidity be important to many terrestrial isopods?",["It helps maintain suitable conditions for respiration and water balance","It replaces oxygen","It prevents every pathogen","It eliminates all temperature needs"],0,"Moisture conditions influence respiratory function and water balance."),
 Q("Why should an enclosure have appropriate ventilation?",["For gas exchange and moisture regulation","To eliminate all humidity","To prevent any food decay","To replace substrate"],0,"Ventilation helps manage gas exchange and excess condensation."),
 Q("Are moisture needs identical across all terrestrial isopods?",["No; ecology and species differ","Yes; all need complete saturation","Yes; all require total dryness","No; none require moisture"],0,"Terrestrial isopods vary in habitat preferences and tolerance.")
 ]),
 quiz("classification","The Crustacean Connection","Explore where isopods fit in animal classification.","Medium",[
 Q("Isopods are classified as which animals?",["Crustaceans","Insects","Arachnids","Molluscs"],0,"Isopods belong to Crustacea, a diverse group of arthropods that also includes crabs and shrimp."),
 Q("What is the order containing isopods called?",["Isopoda","Araneae","Coleoptera","Gastropoda"],0,"Isopoda is the crustacean order that includes terrestrial and aquatic isopods."),
 Q("What does a genus name represent?",["A taxonomic grouping of related species","A standardized colour code","A substrate layer","An individual's age"],0,"A genus groups species in biological classification."),
 Q("Why should scientific names be checked against current references?",["Classification and identifications can change","Species never change names","Hobby nicknames are always taxonomic","Scientific names describe humidity"],0,"Taxonomic understanding and naming can be revised with new evidence.")
 ])
 ].map(p=>({gameKey:"species-quiz" as const,mode:"quiz" as const,puzzle:p})),
 ...[
 burrow("leaf-matter","Leaf Matter","LEAFY","Describes a forest floor with plenty of fallen leaves.","Leafy areas provide food and shelter through decaying plant matter."),
 burrow("shelter","Find Cover","COVER","Protection provided by leaves, bark or other sheltered surfaces.","Leaf litter and bark provide cover and microhabitats."),
 burrow("decomposers","Decomposer Clue","FUNGI","A plural term for organisms that help break down dead material.","Fungi participate in decomposition.")
 ].map(p=>({gameKey:"word-burrow" as const,mode:"burrow" as const,puzzle:p})),
 ...[
 connections("parts-and-places","Everyday Isopod Words",[
 group("Places to hide",["Cork shelter","Log","Rock","Leaf pile"]),
 group("Fresh food",["Carrot","Squash","Cucumber","Sweet potato"]),
 group("Things to observe",["Movement","Feeding time","New young","Shedding"]),
 group("Enclosure supplies",["Vent holes","Water bottle","Calcium dish","Soil mix"])
 ]),
 connections("names-and-needs","Species & Care",[
 group("Genera",["Porcellio","Oniscus","Cubaris","Armadillidium"]),
 group("Common hobby names",["Penguin","Papaya","Giant Canyon","Magic Potion"]),
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
 ...[
 crossword("anatomy-clues","The Keeper's Kit",[
 {answer:"CARE",clue:"Attention given to captive animals (4)",r:1,c:2,dir:"down"},
 {answer:"CORK",clue:"Bark material often used as a hide (4)",r:0,c:4,dir:"down"},
 {answer:"AIR",clue:"A mixture of gases exchanged through ventilation (3)",r:3,c:0,dir:"across"},
 {answer:"REFUGE",clue:"A sheltered place (6)",r:0,c:8,dir:"down"},
 {answer:"ENCLOSURE",clue:"A container housing a captive colony (9)",r:1,c:0,dir:"across"}
 ]),
 crossword("forest-words","The Forest Floor",[
 {answer:"MOSS",clue:"A non-vascular plant sometimes used as a moist refuge (4)",r:0,c:0,dir:"down"},
 {answer:"MANCA",clue:"A juvenile stage in isopod development (5)",r:0,c:0,dir:"across"},
 {answer:"ONISCUS",clue:"An isopod genus (7)",r:4,c:1,dir:"across"},
 {answer:"SOIL",clue:"Ground material that may form part of substrate (4)",r:2,c:3,dir:"down"},
 {answer:"SUBSTRATE",clue:"Material lining the floor of an enclosure (9)",r:2,c:0,dir:"across"}
 ]),
 crossword("keeper-words","Anatomy Terms",[
 {answer:"PLEON",clue:"The abdominal region of an isopod (5)",r:0,c:2,dir:"across"},
 {answer:"PEREON",clue:"The main thoracic body region (6)",r:1,c:1,dir:"down"},
 {answer:"LEAF",clue:"Fallen plant material commonly consumed by isopods (4)",r:4,c:0,dir:"across"},
 {answer:"EXUVIA",clue:"A shed exoskeleton (6)",r:2,c:1,dir:"across"},
 {answer:"ONISCUS",clue:"A genus of terrestrial isopods (7)",r:0,c:5,dir:"down"}
 ])
 ].map(p=>({gameKey:"crossword-colony" as const,mode:"crossword" as const,puzzle:p})),
 ...[
 search("leaf-litter","Life in the Litter",["LITTER","DEBRIS","COMPOST","DETRITUS","FUNGI","MICROBES","HUMUS","DECAY"],19737,"Discover words for what happens to fallen plant material as it decomposes."),
 search("keeper-essentials","Keeper Essentials",["MOISTURE","FEEDING","CALCIUM","VENTILATION","SUBSTRATE","SPRAYER","ENCLOSURE","HUMIDITY"],81927,"Find familiar enclosure and husbandry terms."),
 search("anatomy-terms","Science Words",["MOLT","MANCA","GENUS","SPECIES","ANTENNA","ABDOMEN","JUVENILE","EXUVIA"],34987,"A bridge to science: words introduced in earlier quizzes.")
 ].map(p=>({gameKey:"word-search" as const,mode:"search" as const,puzzle:p}))
];
// Fifth stages are new IDs appended after all existing IDs. Historical
// completion rows stay valid; established puzzle order is never reshuffled.
const extension:Entry[]=[
 {gameKey:"species-detective",mode:"quiz",puzzle:quiz("field-notes","Scientific Field Notes","Distinguish species, morphs and genus names using clues.", "Expert",[
  Q("A label reads Porcellio scaber. Which word tells you the genus?",["Porcellio","scaber","Both names mean a morph","Neither name"],0,"Porcellio is the genus; scaber is the specific epithet. The two words form the species name."),
  Q("Two isopods share a colour but look structurally different. What is most useful next?",["Compare diagnostic body features and published references","Assume they are the same species","Choose the largest one as the adult","Name both after their colour"],0,"Colours may be shared across taxa. Reliable structural characters and references are more useful."),
  Q("Which is an informal hobby name rather than a binomial scientific name?",["Titan","Porcellio hoffmannseggi","Oniscus asellus","Armadillidium maculatum"],0,"Titan is a hobby nickname. The species name Porcellio hoffmannseggi provides a more specific identification."),
  Q("What does sp. indicate in a label such as Cubaris sp.?",["The exact species is unspecified","The animal is a subspecies","The colour is confirmed","The animal is an adult"],0,"sp. marks an unspecified species within a genus. It should not be treated as a confirmed species-level name.")
 ])},
 {gameKey:"keepers-challenge",mode:"quiz",puzzle:quiz("colony-casebook","The Colony Casebook","Make careful decisions when several conditions interact.","Expert",[
  Q("A new colony clusters under one damp hide while the rest of the substrate is dry. Your first step?",["Check the species and moisture gradient before adjusting","Flood everything immediately","Remove the only refuge","Stop ventilating altogether"],0,"Clustering can signal that the rest of the enclosure is unsuitable; verify the species' requirements and measured conditions."),
  Q("An enclosure smells stagnant and stays saturated after misting. Which pairing deserves review?",["Ventilation and watering frequency","The pattern of isopods and the brand of bark","Only calcium colour","The label font"],0,"Prolonged saturation and poor airflow can harm suitable microhabitats. Correct the underlying husbandry conditions."),
  Q("A colony stops breeding after several changes. What is the soundest investigation?",["Review records and change one variable at a time","Switch all food and substrate daily","Assume every adult is infertile","Ignore temperature and moisture"],0,"Stable conditions and careful observations let keepers isolate potential causes."),
  Q("A species is described as cave-associated. What does that imply for its care?",["Investigate its ecology before making assumptions","Keep it completely submerged","Never provide a dry refuge","Use one universal setup for all cave species"],0,"Cave ecology can suggest protected microclimates, but captive requirements must be verified for each species.")
 ])},
 {gameKey:"word-of-the-week",mode:"quiz",puzzle:quiz("science-vocabulary","Science Vocabulary","Connect new anatomy and taxonomy words to their meanings.","Expert",[
  Q("The pereon is the main thoracic region. What is the pleon?",["The abdominal region","The genus name","The outer leaf covering","A calcium source"],0,"The pleon is the abdominal region, while the pereon is the thoracic trunk."),
  Q("What is a uropod?",["A paired appendage toward the rear","The soil surface","A species of moss","The whole brood pouch"],0,"Uropods are posterior appendages that may help distinguish some taxa."),
  Q("What does conglobation describe?",["Rolling the body into a ball","Shedding only one antenna","Eating decomposed leaves","Brooding offspring"],0,"Conglobation is defensive rolling into a ball, seen in certain isopod lineages."),
  Q("A scientific name has two parts. What is the specific epithet?",["Its second word","Its first word","A care category","An informal nickname"],0,"In a name such as Porcellio scaber, scaber is the specific epithet.")
 ])},
 {gameKey:"species-quiz",mode:"quiz",puzzle:quiz("the-science-bench","The Science Bench","Put your new biology vocabulary to work.","Expert",[
  Q("Which body appendages support respiratory structures in many terrestrial isopods?",["Pleopods","Antenna tips","Walking claws","Mandibles only"],0,"Many terrestrial isopods have respiratory structures associated with abdominal pleopods."),
  Q("Which term refers to the brood pouch carried by a female?",["Marsupium","Uropod","Pleon","Exuvia"],0,"The marsupium is the ventral brood pouch where developing young are carried."),
  Q("What does detritivore describe?",["An animal feeding on dead organic matter","A species that eats only live prey","A completely aquatic group","An adult stage of isopod"],0,"Detritivores contribute to decomposing organic material and nutrient cycling."),
  Q("What does an exuvia represent?",["A shed exoskeleton","A genus of isopod","A type of substrate","A breathing appendage"],0,"Exuvia is the cast-off exoskeleton left after moulting.")
 ])},
 {gameKey:"word-burrow",mode:"burrow",puzzle:burrow("genus-clue","The First Name","GENUS","The first word in a two-part scientific species name.","Genus groups related species. For example, Porcellio is the genus in Porcellio scaber.","Expert")},
 {gameKey:"colony-connections",mode:"connections",puzzle:connections("scientific-sorting","The Science Sorting Bench",[
  group("Body regions",["Pereon","Pleon","Cephalon","Pleotelson"]),
  group("Body appendages",["Antennae","Uropods","Pleopods","Pereopods"]),
  group("Taxonomic terms",["Genus","Species","Epithet","Binomial"]),
  group("Development terms",["Manca","Marsupium","Moult","Exuvia"])
 ])},
 {gameKey:"crossword-colony",mode:"crossword",puzzle:crossword("science-crossword","The Science Trail",[
  {answer:"MARSUPIUM",clue:"A female isopod's ventral brood pouch (9)",r:4,c:0,dir:"across"},
  {answer:"PLEOPOD",clue:"One abdominal appendage that can bear respiratory structures (7)",r:0,c:5,dir:"down"},
  {answer:"GENUS",clue:"The first word of a two-part species name (5)",r:0,c:3,dir:"down"},
  {answer:"EXUVIA",clue:"A cast-off exoskeleton after moulting (6)",r:2,c:5,dir:"across"},
  {answer:"UROPOD",clue:"One of the paired appendages toward the rear of an isopod (6)",r:6,c:0,dir:"across"}
 ])},
 {gameKey:"word-search",mode:"search",puzzle:search("genera-field-guide","Scientific Names",["CUBARIS","PORCELLIO","ARMADILLIDIUM","PORCELLIONIDES","TRICHORHINA","ONISCUS","PHILOSCIA","NAGURUS"],4321987,"Find eight isopod genera once you are familiar with scientific naming.")}
];

const sample:Entry[]=[
 ...games.map(game=>({
 gameKey:game.key,mode:game.mode,
 puzzle:game.mode==="quiz"?quiz("sample-01",game.puzzleTitle,game.description,"Intro",game.questions||[])
 :game.mode==="burrow"?burrow("sample-01",game.puzzleTitle,"WATER","A five-letter liquid used to moisten an isopod refuge.","Water helps maintain moist areas; do not flood the enclosure.")
 :game.mode==="connections"?connections("sample-01",game.puzzleTitle,connectionGroups)
 :crossword("sample-01",game.puzzleTitle,originalCrossword)
 } as Entry)),
 {gameKey:"word-search",mode:"search",puzzle:search("genus-explorer","First Finds",["LEAF","MOSS","BARK","SOIL","CORK","WATER","HIDE","FOOD"],24681357,"Start with eight familiar enclosure words.")}
];
const baseEntries:Entry[]=[...sample,...extra,...extension];
const levelNames=["Starter","Familiar","Explorer","Practiced","Specialist","Expert"];
// The level is defined by the server-owned sequence, never by an arbitrary
// label in an individual puzzle bank. Existing IDs keep their order.
export const puzzleEntries:Entry[]=baseEntries.map(entry=>{
 const level=baseEntries.filter(other=>other.gameKey===entry.gameKey).findIndex(other=>other.puzzle.id===entry.puzzle.id);
 return {...entry,puzzle:{...entry.puzzle,difficulty:"Level "+(level+1)+" · "+(levelNames[level]||"Mastery")}};
});
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
// Reject cloned rounds and verbatim repeated questions in a game. Teaching
// one term through different games is deliberate spaced reinforcement.
const seenPuzzles=new Set<string>();
const seenQuizPrompts=new Set<string>();
const seenSearchWords=new Set<string>();
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
for(const entry of puzzleEntries){
 const {puzzle,mode,gameKey}=entry;
 let fingerprint:string;
 if(mode==="quiz"){
  const questions=(puzzle as QuizPuzzle).questions;
  fingerprint=questions.map(q=>normalize(q.prompt)).sort().join("|");
  for(const question of questions){
   const prompt=normalize(question.prompt);
   if(seenQuizPrompts.has(prompt))throw new Error("Repeated quiz question across Fun Zone: "+prompt);
   seenQuizPrompts.add(prompt);
   if(new Set(question.choices.map(normalize)).size!==4)throw new Error("Duplicate answer choices in "+gameKey);
  }
 }else if(mode==="connections"){
  const groups=(puzzle as ConnectionsPuzzle).groups;
  fingerprint=groups.flatMap(g=>g.words.map(normalize)).sort().join("|");
  if(new Set(groups.map(g=>normalize(g.label))).size!==4)throw new Error("Repeated group labels in "+gameKey);
 }else if(mode==="search"){
  const words=(puzzle as SearchPuzzle).words.map(normalize);
  fingerprint=words.slice().sort().join("|");
  if(new Set(words).size!==words.length)throw new Error("Repeated search word in "+gameKey);
  for(const word of words){if(seenSearchWords.has(word))throw new Error("Recycled word-search solution: "+word);seenSearchWords.add(word);}
 }else if(mode==="burrow"){
  fingerprint=(puzzle as BurrowPuzzle).answer.toLowerCase();
 }else{
  fingerprint=(puzzle as CrosswordPuzzle).clues.map(c=>c.answer).sort().join("|");
 }
 const key=gameKey+":"+mode+":"+fingerprint;
 if(seenPuzzles.has(key))throw new Error("Duplicate puzzle content in "+gameKey+": "+puzzle.id);
 seenPuzzles.add(key);
}
for(const key of gameKeys){
 const count=getPuzzles(key).length;
 if(count<4||count>10)throw new Error("Invalid progression length in "+key+": "+count);
 const ids=getPuzzles(key).map(e=>e.puzzle.id);
 if(new Set(ids).size!==ids.length)throw new Error("Duplicate puzzle ID in "+key);
}
