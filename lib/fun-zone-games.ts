export type GameKey="crossword-colony"|"colony-connections"|"word-burrow"|"species-detective"|"keepers-challenge"|"word-of-the-week"|"species-quiz";
export type Question={prompt:string;choices:string[];answer:number;explanation:string};
export type Game={key:GameKey;title:string;subtitle:string;category:string;mark:string;mode:"quiz"|"connections"|"burrow"|"crossword";puzzleTitle:string;description:string;questions?:Question[]};
export const games:Game[]=[
 {key:"crossword-colony",title:"Crossword Colony",subtitle:"Solve clues from the world of isopods.",category:"Word",mark:"▦",mode:"crossword",puzzleTitle:"Keeper's Vocabulary",description:"Five intersecting ideas from basic isopod keeping."},
 {key:"colony-connections",title:"Colony Connections",subtitle:"Find the four groups of four isopod-related terms.",category:"Logic",mark:"◇",mode:"connections",puzzleTitle:"Colony Connections · Set 01",description:"Sort sixteen terms into their four related groups."},
 {key:"word-burrow",title:"Word Burrow",subtitle:"Unearth a hidden isopod word in six guesses.",category:"Word",mark:"ABC",mode:"burrow",puzzleTitle:"Hidden in the Litter",description:"Guess a five-letter habitat word. Correct letters reveal your path."},
 {key:"species-detective",title:"Species Detective",subtitle:"Use morphological and common-name clues to recognize species.",category:"Knowledge",mark:"⌕",mode:"quiz",puzzleTitle:"Know Your Isopods",description:"Three species identification questions.",questions:[
 {prompt:"Which commonly kept isopod is famous for its black-and-white spotted appearance and prolific breeding?",choices:["Dairy Cow","Rubber Ducky","Clown","Powder Blue"],answer:0,explanation:"The Dairy Cow morph of Porcellio laevis is known for its black-and-white markings."},
 {prompt:"Which isopod is widely recognized for a face-like pattern resembling a yellow duck?",choices:["Giant Canyon","Rubber Ducky","Powder Orange","Dairy Cow"],answer:1,explanation:"Cubaris sp. ‘Rubber Ducky’ is named for the duck-like appearance of its front."},
 {prompt:"Armadillidium klugii is commonly sold under which name?",choices:["Clown","Titan","Penguin","Papaya"],answer:0,explanation:"The Clown isopod is a common hobby name for Armadillidium klugii."}
 ]},
 {key:"keepers-challenge",title:"Keeper's Challenge",subtitle:"Solve realistic husbandry decisions and build good habits.",category:"Logic",mark:"☷",mode:"quiz",puzzleTitle:"The Balanced Bin",description:"Three care situations; choose the safest response.",questions:[
 {prompt:"One end of your isopod enclosure has dried noticeably. What is a sensible first response?",choices:["Flood the entire bin","Check and restore the moisture gradient","Seal all ventilation","Remove every hide"],answer:1,explanation:"Maintaining a suitable moist refuge and species-appropriate gradient is safer than soaking the whole enclosure."},
 {prompt:"Your colony ignores a large piece of fresh food for days. What should you do?",choices:["Keep adding more","Remove uneaten perishables and offer smaller amounts","Stop providing leaf litter","Eliminate ventilation"],answer:1,explanation:"Removing old perishables helps reduce mould and pests; offer amounts the colony can consume."},
 {prompt:"You move a colony into a different enclosure. Which approach is best?",choices:["Change every condition daily","Watch behaviour and adjust conditions gradually","Keep the substrate completely dry","Feed only vegetables"],answer:1,explanation:"Observe how the colony responds and make thoughtful, gradual changes when needed."}
 ]},
 {key:"word-of-the-week",title:"Word of the Week",subtitle:"Learn a new term from the isopod world.",category:"Daily",mark:"✧",mode:"quiz",puzzleTitle:"Meet the Uropods",description:"A short learning challenge. This is a sample lesson, not an automatically rotating weekly word.",questions:[
 {prompt:"What are uropods?",choices:["Paired structures near the rear of an isopod","A type of substrate","A genus of tropical isopod","A breathing enclosure"],answer:0,explanation:"Uropods are paired appendages at the posterior of many isopods. Their shape can help with identification."}
 ]},
 {key:"species-quiz",title:"Species Quiz",subtitle:"Test your isopod knowledge, one question at a time.",category:"Knowledge",mark:"?",mode:"quiz",puzzleTitle:"Isopod Basics",description:"A small general-knowledge quiz.",questions:[
 {prompt:"Isopods belong to which larger animal group?",choices:["Insects","Crustaceans","Arachnids","Molluscs"],answer:1,explanation:"Isopods are crustaceans, related to other groups such as amphipods and decapods."},
 {prompt:"Why is leaf litter important in many terrestrial isopod enclosures?",choices:["It is only decoration","It provides food and cover","It replaces moisture management","It stops all mould"],answer:1,explanation:"Leaf litter often acts as both food and shelter, supporting a suitable microhabitat."},
 {prompt:"What is a moisture gradient?",choices:["A uniform wet enclosure","Areas with differing moisture levels","A daily feeding schedule","A type of isopod morph"],answer:1,explanation:"A moisture gradient provides different humidity zones so isopods can choose suitable conditions."}
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
