export type GameKey="crossword-colony"|"colony-connections"|"word-burrow"|"species-detective"|"keepers-challenge"|"word-of-the-week"|"species-quiz";
export type Question={prompt:string;choices:string[];answer:number;explanation:string};
export type Game={key:GameKey;title:string;subtitle:string;category:string;mark:string;mode:"quiz"|"connections"|"burrow"|"crossword";puzzleTitle:string;description:string;questions?:Question[]};
export const games:Game[]=[
 {key:"crossword-colony",title:"Crossword Colony",subtitle:"Solve clues from the world of isopods.",category:"Word",mark:"▦",mode:"crossword",puzzleTitle:"Keeper's Vocabulary",description:"Five intersecting ideas from basic isopod keeping."},
 {key:"colony-connections",title:"Colony Connections",subtitle:"Find the four groups of four isopod-related terms.",category:"Logic",mark:"◇",mode:"connections",puzzleTitle:"Colony Connections · Set 01",description:"Sort sixteen terms into their four related groups."},
 {key:"word-burrow",title:"Word Burrow",subtitle:"Unearth a hidden isopod word in six guesses.",category:"Word",mark:"ABC",mode:"burrow",puzzleTitle:"Hidden in the Litter",description:"Uncover an isopod-related five-letter word. Every answer has a precise clue."},
 {key:"species-detective",title:"Species Detective",subtitle:"Recognize familiar isopods, then learn scientific identification.",category:"Knowledge",mark:"⌕",mode:"quiz",puzzleTitle:"Meet the Isopods",description:"Meet familiar hobby isopods using simple colours, patterns and names.",questions:[
 {prompt:"Which isopod is named for its black-and-white cow-like markings?",choices:["Dairy Cow","Rubber Ducky","Clown","Powder Blue"],answer:0,explanation:"Dairy Cow is a black-and-white morph commonly kept in the hobby. Its scientific name is usually given as Porcellio laevis."},
 {prompt:"Which isopod gets its nickname from a duck-like face pattern?",choices:["Giant Canyon","Rubber Ducky","Powder Orange","Dairy Cow"],answer:1,explanation:"Rubber Ducky is a hobby name for a Cubaris isopod with distinctive yellow facial markings."},
 {prompt:"Which familiar hobby isopod has stripes that resemble a zebra?",choices:["Zebra","Titan","Papaya","Powder Orange"],answer:0,explanation:"The Zebra isopod is known for its stripes. Later you'll learn its scientific name: Armadillidium maculatum."},
 {prompt:"What do hobbyists usually mean by an isopod 'morph'?",choices:["A variation in appearance","A type of enclosure","A feeding tool","An adult-only stage"],answer:0,explanation:"A morph is a recognizable form or variation, often with distinctive colours or patterns. A morph is not necessarily a separate species."},
 {prompt:"Which name is more likely to describe colour rather than a scientific species?",choices:["Powder Blue","Porcellio scaber","Oniscus asellus","Armadillidium klugii"],answer:0,explanation:"Powder Blue is a hobby colour name. Scientific names usually contain a genus followed by a species name."},
 {prompt:"When identifying an unfamiliar isopod, what should you do?",choices:["Check reliable descriptions and body features","Rely only on its colour","Guess from its enclosure","Use the food it eats as its name"],answer:0,explanation:"Colour can vary. Shape, patterns and reliable identification references help distinguish species."}
 ]},
 {key:"keepers-challenge",title:"Keeper's Challenge",subtitle:"Solve realistic husbandry decisions and build good habits.",category:"Logic",mark:"☷",mode:"quiz",puzzleTitle:"The Balanced Bin",description:"Six care situations; choose a thoughtful response.",questions:[
 {prompt:"One end of your isopod enclosure has dried noticeably. What is a sensible first response?",choices:["Flood the entire bin","Check and restore the moisture gradient","Seal all ventilation","Remove every hide"],answer:1,explanation:"Maintaining a suitable moist refuge and species-appropriate gradient is safer than soaking the whole enclosure."},
 {prompt:"Your colony ignores a large piece of fresh food for days. What should you do?",choices:["Keep adding more","Remove uneaten perishables and offer smaller amounts","Stop providing leaf litter","Eliminate ventilation"],answer:1,explanation:"Removing old perishables helps reduce mould and pests; offer amounts the colony can consume."},
 {prompt:"You move a colony into a different enclosure. Which approach is best?",choices:["Change every condition daily","Watch behaviour and adjust conditions gradually","Keep the substrate completely dry","Feed only vegetables"],answer:1,explanation:"Observe how the colony responds and make thoughtful, gradual changes when needed."},
 {prompt:"Condensation covers the entire enclosure and the substrate is saturated. What should you review?",choices:["Ventilation and how much water you add","Whether to add more standing water","Removing all leaf litter immediately","Adding only protein"],answer:0,explanation:"Persistent saturation can reduce suitable drier areas. Assess ventilation, drainage and the species' moisture needs rather than making the whole enclosure wetter."},
 {prompt:"You notice a deceased isopod. What is the most informative next step?",choices:["Assume the whole colony is diseased","Check conditions and look for a pattern of losses","Immediately discard the entire culture","Stop feeding permanently"],answer:1,explanation:"A single death is not diagnostic. Check moisture, temperature, ventilation, food and whether deaths are recurring before drawing conclusions."},
 {prompt:"Why should a keeper offer a reliable calcium source?",choices:["To replace decaying leaves","To support exoskeleton maintenance and moulting","To eliminate all humidity","To remove the need for hides"],answer:1,explanation:"Calcium is important for crustacean exoskeletons. Provide suitable calcium alongside a balanced diet; needs vary by colony."}
 ]},
 {key:"word-of-the-week",title:"Word of the Week",subtitle:"Learn keeper vocabulary a little at a time.",category:"Daily",mark:"✧",mode:"quiz",puzzleTitle:"Your First Keeper Words",description:"Start with the everyday words you'll see in the hobby.",questions:[
 {prompt:"What is leaf litter?",choices:["Fallen leaves on the ground","A type of plastic","Only live insects","An isopod's eggs"],answer:0,explanation:"Leaf litter means fallen leaves. For many isopods, decaying leaf litter supplies both food and cover."},
 {prompt:"What does it mean when an isopod moults?",choices:["It sheds its old outer covering","It changes into a beetle","It stops growing forever","It lays leaves"],answer:0,explanation:"Moulting is how an isopod sheds its old exoskeleton to grow. Exoskeleton means its hard outer covering."},
 {prompt:"What is the substrate in an enclosure?",choices:["The material covering its floor","The lid's handle","A species name","A type of light"],answer:0,explanation:"Substrate is the soil-like material on the enclosure floor. It provides a living surface and can hold moisture."},
 {prompt:"What does a humid area feel like?",choices:["Moist rather than dry","Frozen and brittle","Always flooded","Without any air"],answer:0,explanation:"Humidity describes moisture in the air. Many isopods benefit from a suitable moist refuge."},
 {prompt:"What does a 'morph' usually describe in the hobby?",choices:["A variation in appearance","A family of insects","A special tank size","An animal's age"],answer:0,explanation:"Morph is a hobby term for a recognizable form, such as a colour or pattern variation."}
 ]},
 {key:"species-quiz",title:"Species Quiz",subtitle:"Start with isopod basics and build your science knowledge.",category:"Knowledge",mark:"?",mode:"quiz",puzzleTitle:"First Steps",description:"Six simple questions about isopods and their homes.",questions:[
 {prompt:"Is an isopod an animal or a plant?",choices:["An animal","A plant","A mushroom","A mineral"],answer:0,explanation:"Isopods are animals. More specifically, they belong to the crustacean group, like crabs and shrimp."},
 {prompt:"What do many terrestrial isopods eat?",choices:["Decaying leaves","Only fresh meat","Plastic","Rocks"],answer:0,explanation:"Many land isopods feed on decaying plant matter and other organic material."},
 {prompt:"Why do keepers add cork bark or leaf litter?",choices:["To provide hiding places","To make the bin airtight","To remove all humidity","To prevent every moult"],answer:0,explanation:"Bark and leaf litter give isopods cover and help create natural hiding spaces."},
 {prompt:"Which is a sensible thing to check when caring for isopods?",choices:["Moisture and ventilation","The colour of the lid only","The time on a clock only","The brand of container"],answer:0,explanation:"Moisture and airflow both affect the enclosure environment. Different species need different conditions."},
 {prompt:"What is the hard outer covering of an isopod called?",choices:["An exoskeleton","A feather coat","A flower","A shell made of paper"],answer:0,explanation:"Exoskeleton means a protective outer skeleton. You'll meet this term again when learning about moulting."},
 {prompt:"What does a juvenile isopod mean?",choices:["A young isopod","An old isopod","A type of food","An enclosure tool"],answer:0,explanation:"Juvenile means young. A very early developmental stage in isopods is called a manca—an advanced term for later."}
 ]}

];
export function getGame(key:string){return games.find(g=>g.key===key);}
export const connectionGroups=[
 {label:"Things found in nature",words:["Leaf","Moss","Bark","Soil"]},
 {label:"Keeper tools",words:["Sprayer","Tweezers","Thermometer","Scoop"]},
 {label:"Familiar hobby names",words:["Dairy Cow","Rubber Ducky","Zebra","Clown"]},
 {label:"Food sources",words:["Vegetable","Cuttlebone","Rotten wood","Fish food"]}
];
export const crosswordClues=[
 {answer:"LEAF",clue:"Dried plant material often used as food and cover (4)"},
 {answer:"MOSS",clue:"Green plant material sometimes used in moist areas (4)"},
 {answer:"HIDE",clue:"A shelter in the enclosure (4)"},
 {answer:"MOIST",clue:"The opposite of dry; describes a humid refuge (5)"},
 {answer:"CORK",clue:"A type of bark often used as a shelter (4)"}
];
