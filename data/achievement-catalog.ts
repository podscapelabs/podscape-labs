export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  exp: number;
  coins: number;
  icon: string;
  href: string;
  status: "available" | "planned";
};

// Earnable achievements only reference events PodScape already records.
// The older Field Observer achievement keeps its historical reward label;
// future achievements award EXP only, reserving Pod Coins for purchases.
export const achievementCatalog: AchievementDefinition[] = [
  { key:"ledger_first_species", title:"First Sighting", description:"Discover your first unique species in the Leaf Ledger.", exp:10, coins:0, icon:"⌕", href:"/ledger", status:"available" },
  { key:"ledger_five_species", title:"Field Observer", description:"Discover 5 unique species profiles in the Leaf Ledger.", exp:50, coins:25, icon:"⌕", href:"/ledger", status:"available" },
  { key:"ledger_ten_species", title:"Species Scout", description:"Discover 10 unique species profiles.", exp:35, coins:0, icon:"✦", href:"/ledger", status:"available" },
  { key:"ledger_twenty_species", title:"Field Naturalist", description:"Discover 20 unique species profiles.", exp:75, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"ledger_fifty_species", title:"Living Encyclopedia", description:"Discover 50 unique species profiles.", exp:150, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"collection_first_species", title:"First Colony", description:"Add your first species to My Collection.", exp:15, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"collection_three_species", title:"Growing Collection", description:"Add 3 different species to My Collection.", exp:25, coins:0, icon:"✿", href:"/ledger", status:"available" },
  { key:"collection_five_species", title:"Keeper's Shelf", description:"Add 5 different species to My Collection.", exp:40, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"collection_ten_species", title:"Dedicated Keeper", description:"Add 10 different species to My Collection.", exp:75, coins:0, icon:"✦", href:"/ledger", status:"available" },
  { key:"collection_twenty_species", title:"Colony Curator", description:"Add 20 different species to My Collection.", exp:125, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"collection_fifty_species", title:"Grand Collector", description:"Add 50 different species to My Collection.", exp:250, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"care_journal", title:"Care Journal", description:"A future milestone for consistent colony care logs.", exp:0, coins:0, icon:"▤", href:"/keeper", status:"planned" },
  { key:"puzzle_pathfinder", title:"Puzzle Pathfinder", description:"Future recognition for exploring the Fun Zone.", exp:0, coins:0, icon:"◇", href:"/fun-zone", status:"planned" },
];
