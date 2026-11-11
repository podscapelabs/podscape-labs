/**
 * Pre-play learning cues for each sequential Fun Zone puzzle.
 * These teach vocabulary without revealing quiz answers or Connections groups.
 * Every game has its own progression; no cross-game completion is required.
 */
export const FUN_ZONE_LESSONS:Record<string,readonly string[]>={
 "species-detective":[
  "Start with familiar hobby names and visible patterns. A morph is a variation in appearance, not automatically a new species.",
  "A striped Zebra and a spotted Dairy Cow can be recognized by common names first. Scientific names will come later.",
  "Scientific species names have two words: the genus comes first. Porcellio scaber is one example.",
  "Compare body form and pattern as well as colour. Hobby nicknames are helpful, but are not formal species names.",
  "You're ready for identification vocabulary. 'sp.' means the exact species has not been identified or specified."
 ],
 "keepers-challenge":[
  "Look for the safest first step, not the most dramatic fix. Suitable moisture and ventilation depend on the species.",
  "A gradient means different zones: one refuge can be damp while another area is drier.",
  "Feed modestly, remove spoiled fresh foods and keep the staple leaf litter available.",
  "Care observations are clues, not a diagnosis. Look for patterns before changing multiple conditions.",
  "Think like a keeper: combine observations, species-specific needs and gradual adjustments."
 ],
 "word-of-the-week":[
  "Begin with leaf litter, substrate, humidity and moulting. We'll explain new words after every question.",
  "A manca is a young isopod. A female carries developing offspring in a brood pouch called a marsupium.",
  "Antennae sense the environment. Exoskeleton means the hard outer covering; posterior means toward the rear.",
  "An exuvia is a shed exoskeleton. Many isopods moult in two phases rather than shedding the whole covering at once.",
  "A genus is the first word of a species name. Pereon and pleon are body regions; uropods are structures near the rear."
 ],
 "species-quiz":[
  "Start with the essentials: isopods are crustaceans that need food, cover and appropriate moisture.",
  "Detritus is dead organic material. A detritivore is an animal that feeds on it; leaf litter is a familiar example.",
  "Pleopods are appendages on the abdomen. Their modified structures are involved in breathing in many terrestrial isopods.",
  "Species names have two parts. The first is the genus; the second is called the specific epithet.",
  "Your science challenge brings together pleopods, the marsupium brood pouch, detritivores and exuviae."
 ],
 "word-burrow":[
  "Start with an everyday five-letter keeper word. The clue tells you what the word describes.",
  "This word describes a place with plenty of leaves. Think about the forest floor.",
  "Think of a five-letter word for shelter from the open air.",
  "Think of the plural five-letter word for organisms, including moulds, that help break down dead material.",
  "Scientific species names have two parts. Think of the five-letter term for their first naming group."
 ],
 "colony-connections":[
  "Everything here is familiar: nature, enclosure tools, food and common hobby names. Find one clear group of four at a time.",
  "Think of everyday enclosure experiences: what you feed, observe and use as supplies.",
  "A genus groups related species. Porcellio, Cubaris and Oniscus are examples; other tiles describe food, care or hobby nicknames.",
  "Manca means juvenile; pereon and pleon are body regions; a uropod is a rear appendage. Use those definitions to look for relationships.",
  "This is specialist vocabulary: pereon/pleon are regions, uropods/pleopods are appendages, and genus/species are naming terms."
 ],
 "crossword-colony":[
  "Begin with enclosure materials. A little new vocabulary is introduced directly in the clues.",
  "Use common keeper words such as cork, shelter and enclosure. The number in brackets tells you the answer length.",
  "Manca means juvenile. Substrate is the enclosure floor material. Oniscus is the name of an isopod genus.",
  "Pereon is the thoracic region, pleon is the abdominal region, and exuvia is a shed exoskeleton."
 ],
 "word-search":[
  "Find familiar words from a keeper's enclosure. The complete word list is displayed so you can learn by spotting.",
  "Detritus is decaying organic material; microbes and fungi help decompose it. You can look for these words without memorizing them.",
  "Spot care words such as ventilation, substrate and humidity—terms you'll see in keeper guides.",
  "A manca is a young isopod, exuvia means a shed exoskeleton, and genus is a scientific naming category.",
  "These are scientific genus names, not everyday words. Look for the names as patterns; memorization isn't required."
 ]
};
export function getFunZoneLearningNote(gameKey:string,levelIndex:number):string{
 return FUN_ZONE_LESSONS[gameKey]?.[levelIndex]||
  "Every puzzle teaches through play. Read the explanations, then apply what you've learned in the next challenge.";
}
