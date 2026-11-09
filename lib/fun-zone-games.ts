export type GameKey="crossword-colony"|"colony-connections"|"word-burrow"|"species-detective"|"keepers-challenge"|"word-of-the-week"|"species-quiz";
export type Question={prompt:string;choices:string[];answer:number;explanation:string};
export type Game={key:GameKey;title:string;subtitle:string;category:string;mark:string;mode:"quiz"|"connections"|"burrow"|"crossword";puzzleTitle:string;description:string;questions?:Question[]};
export const games:Game[]=[
 {key:"crossword-colony",title:"Crossword Colony",subtitle:"Solve clues from the world of isopods.",category:"Word",mark:"▦",mode:"crossword",puzzleTitle:"Keeper's Vocabulary",description:"Five intersecting ideas from basic isopod keeping."},
 {key:"colony-connections",title:"Colony Connections",subtitle:"Find the four groups of four isopod-related terms.",category:"Logic",mark:"◇",mode:"connections",puzzleTitle:"Colony Connections · Set 01",description:"Sort sixteen terms into their four related groups."},
 {key:"word-burrow",title:"Word Burrow",subtitle:"Unearth a hidden isopod word in six guesses.",category:"Word",mark:"ABC",mode:"burrow",puzzleTitle:"Hidden in the Litter",description:"Uncover an isopod-related five-letter word. Every answer has a precise clue."},
 {key:"species-detective",title:"Species Detective",subtitle:"Use morphological and common-name clues to recognize species.",category:"Knowledge",mark:"⌕",mode:"quiz",puzzleTitle:"Know Your Isopods",description:"Six species identification questions with explanations.",questions:[
 {prompt:"Which commonly kept isopod is famous for its black-and-white spotted appearance and prolific breeding?",choices:["Dairy Cow","Rubber Ducky","Clown","Powder Blue"],answer:0,explanation:"The Dairy Cow morph of Porcellio laevis is known for its black-and-white markings."},
 {prompt:"Which isopod is widely recognized for a face-like pattern resembling a yellow duck?",choices:["Giant Canyon","Rubber Ducky","Powder Orange","Dairy Cow"],answer:1,explanation:"Cubaris sp. ‘Rubber Ducky’ is named for the duck-like appearance of its front."},
 {prompt:"Armadillidium klugii is commonly sold under which name?",choices:["Clown","Titan","Penguin","Papaya"],answer:0,explanation:"The Clown isopod is a common hobby name for Armadillidium klugii."},
 {prompt:"Which genus includes the commonly kept Powder Blue and Powder Orange morphs?",choices:["Oniscus","Porcellionides","Armadillidium","Troglodillo"],answer:1,explanation:"Powder Blue and Powder Orange are commonly kept morphs associated with Porcellionides pruinosus."},
 {prompt:"Which isopod is known in the hobby for its very large, elongated adult form?",choices:["Porcellio hoffmannseggi (Titan)","Cubaris sp. ‘Papaya’","Armadillidium maculatum","Trichorhina tomentosa"],answer:0,explanation:"Porcellio hoffmannseggi is a large-bodied Porcellio species often marketed as Titan."},
 {prompt:"Which genus includes the familiar Zebra isopod?",choices:["Armadillidium","Cubaris","Oniscus","Porcellionides"],answer:0,explanation:"Zebra isopods are the striking striped Armadillidium maculatum."}
 ]},
 {key:"keepers-challenge",title:"Keeper's Challenge",subtitle:"Solve realistic husbandry decisions and build good habits.",category:"Logic",mark:"☷",mode:"quiz",puzzleTitle:"The Balanced Bin",description:"Six care situations; choose a thoughtful response.",questions:[
 {prompt:"One end of your isopod enclosure has dried noticeably. What is a sensible first response?",choices:["Flood the entire bin","Check and restore the moisture gradient","Seal all ventilation","Remove every hide"],answer:1,explanation:"Maintaining a suitable moist refuge and species-appropriate gradient is safer than soaking the whole enclosure."},
 {prompt:"Your colony ignores a large piece of fresh food for days. What should you do?",choices:["Keep adding more","Remove uneaten perishables and offer smaller amounts","Stop providing leaf litter","Eliminate ventilation"],answer:1,explanation:"Removing old perishables helps reduce mould and pests; offer amounts the colony can consume."},
 {prompt:"You move a colony into a different enclosure. Which approach is best?",choices:["Change every condition daily","Watch behaviour and adjust conditions gradually","Keep the substrate completely dry","Feed only vegetables"],answer:1,explanation:"Observe how the colony responds and make thoughtful, gradual changes when needed."},
 {prompt:"Condensation covers the entire enclosure and the substrate is saturated. What should you review?",choices:["Ventilation and how much water you add","Whether to add more standing water","Removing all leaf litter immediately","Adding only protein"],answer:0,explanation:"Persistent saturation can reduce suitable drier areas. Assess ventilation, drainage and the species' moisture needs rather than making the whole enclosure wetter."},
 {prompt:"You notice a deceased isopod. What is the most informative next step?",choices:["Assume the whole colony is diseased","Check conditions and look for a pattern of losses","Immediately discard the entire culture","Stop feeding permanently"],answer:1,explanation:"A single death is not diagnostic. Check moisture, temperature, ventilation, food and whether deaths are recurring before drawing conclusions."},
 {prompt:"Why should a keeper offer a reliable calcium source?",choices:["To replace decaying leaves","To support exoskeleton maintenance and moulting","To eliminate all humidity","To remove the need for hides"],answer:1,explanation:"Calcium is important for crustacean exoskeletons. Provide suitable calcium alongside a balanced diet; needs vary by colony."}
 ]},
 {key:"word-of-the-week",title:"Word of the Week",subtitle:"Learn a new term from the isopod world.",category:"Daily",mark:"✧",mode:"quiz",puzzleTitle:"Meet the Uropods",description:"A five-question anatomy vocabulary lesson. This is a sample, not an automatically rotating weekly lesson.",questions:[
 {prompt:"What are uropods?",choices:["Paired structures near the rear of an isopod","A type of substrate","A genus of tropical isopod","A breathing enclosure"],answer:0,explanation:"Uropods are paired appendages at the posterior of many isopods. Their shape can help with identification."},
 {prompt:"What is an exuvia?",choices:["An isopod's shed exoskeleton","A type of leaf litter","A species nickname","An enclosure humidity reading"],answer:0,explanation:"An exuvia is the cast-off exoskeleton after a moult."},
 {prompt:"What does a manca refer to in isopods?",choices:["A juvenile early developmental stage","An adult male only","A fungal disease","A type of wood"],answer:0,explanation:"A manca is an early juvenile stage of peracarid crustaceans; it typically lacks the final thoracic limb pair at release."},
 {prompt:"What are pleopods?",choices:["Appendages on the abdomen","An enclosure substrate layer","External antenna tips","Juvenile eggs"],answer:0,explanation:"Pleopods are abdominal appendages, modified in terrestrial isopods and involved in functions including gas exchange."},
 {prompt:"What does conglobation describe?",choices:["Rolling the body into a ball","Climbing wet glass","Feeding on fungi only","Exchanging exoskeletons"],answer:0,explanation:"Conglobation is defensive rolling into a ball, a behaviour displayed by certain isopod groups."}
 ]},
 {key:"species-quiz",title:"Species Quiz",subtitle:"Test your isopod knowledge, one question at a time.",category:"Knowledge",mark:"?",mode:"quiz",puzzleTitle:"Isopod Basics",description:"Six introductory questions about terrestrial isopod biology and care.",questions:[
 {prompt:"Isopods belong to which larger animal group?",choices:["Insects","Crustaceans","Arachnids","Molluscs"],answer:1,explanation:"Isopods are crustaceans, related to other groups such as amphipods and decapods."},
 {prompt:"Why is leaf litter important in many terrestrial isopod enclosures?",choices:["It is only decoration","It provides food and cover","It replaces moisture management","It stops all mould"],answer:1,explanation:"Leaf litter often acts as both food and shelter, supporting a suitable microhabitat."},
 {prompt:"What is a moisture gradient?",choices:["A uniform wet enclosure","Areas with differing moisture levels","A daily feeding schedule","A type of isopod morph"],answer:1,explanation:"A moisture gradient provides different moisture zones so isopods can choose suitable conditions."},
 {prompt:"Terrestrial isopods usually breathe using structures associated with which appendages?",choices:["Walking legs alone","Pleopods on the abdomen","Their antennae","Their mandibles"],answer:1,explanation:"Their respiratory structures are associated with modified pleopods; the exact structures vary among taxa."},
 {prompt:"What is a manca?",choices:["A young isopod developmental stage","A type of moss","An adult breeding female only","A hide made of cork"],answer:0,explanation:"Mancae are early juvenile isopods released from the mother's brood pouch."},
 {prompt:"What does the term detritivore mean?",choices:["Feeds primarily on dead organic material","Lives only in open water","Eats exclusively live insects","Cannot process leaf litter"],answer:0,explanation:"Detritivores consume dead and decomposing organic matter, contributing to nutrient cycling."}
 ]}
];
export function getGame(key:string){return games.find(g=>g.key===key);}
export const connectionGroups=[
 {label:"Isopod genera",words:["Cubaris","Porcellio","Oniscus","Armadillidium"]},
 {label:"Anatomy",words:["Antennae","Uropods","Pleopods","Pereon"]},
 {label:"Enclosure materials",words:["Cork bark","Leaf litter","Substrate","Hide"]},
 {label:"Care concepts",words:["Misting","Feeding","Ventilation","Moisture gradient"]}
];
export const crosswordClues=[
 {answer:"LEAF",clue:"Dried plant material often used as food and cover (4)"},
 {answer:"MOSS",clue:"Green plant material sometimes used in moist areas (4)"},
 {answer:"HIDE",clue:"A shelter in the enclosure (4)"},
 {answer:"MOIST",clue:"The opposite of dry; describes a humid refuge (5)"},
 {answer:"CORK",clue:"A type of bark often used as a shelter (4)"}
];
