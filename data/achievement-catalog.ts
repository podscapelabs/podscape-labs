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
  { key:"onboarding_complete", title:"Welcome to PodScape", description:"Finish the introductory platform tour.", exp:35, coins:0, icon:"✧", href:"/app", status:"available" },
  { key:"home_personalized", title:"Make It Yours", description:"Customize your Home dashboard for the first time.", exp:20, coins:0, icon:"❧", href:"/app", status:"available" },
  { key:"nav_personalized", title:"Shortcut Architect", description:"Create your own shortcut arrangement.", exp:20, coins:0, icon:"⠿", href:"/app", status:"available" },
  { key:"species_personalized", title:"Ledger Designer", description:"Personalize the layout of a species profile.", exp:25, coins:0, icon:"⌕", href:"/ledger", status:"available" },
  { key:"manager_personalized", title:"Keeper's Workspace", description:"Customize your colony Manager dashboard.", exp:25, coins:0, icon:"▦", href:"/keeper", status:"available" },
  { key:"customize_three", title:"Your Little World", description:"Personalize three different PodScape workspaces.", exp:60, coins:0, icon:"✿", href:"/app", status:"available" },
  { key:"customize_all", title:"The PodScape Touch", description:"Personalize Home, shortcuts, Species and Manager.", exp:100, coins:0, icon:"✺", href:"/account/progress", status:"available" },
  { key:"care_journal", title:"Care Journal", description:"A future milestone for consistent colony care logs.", exp:0, coins:0, icon:"▤", href:"/keeper", status:"planned" },
  { key:"puzzle_pathfinder", title:"Puzzle Pathfinder", description:"Finish your first unique Fun Zone puzzle.", exp:10, coins:0, icon:"◇", href:"/fun-zone", status:"available" },
  { key:"puzzle_five", title:"Little Problem Solver", description:"Complete 5 different Fun Zone puzzles.", exp:30, coins:0, icon:"✧", href:"/fun-zone", status:"available" },
  { key:"puzzle_sixteen", title:"Puzzle Explorer", description:"Complete 16 different Fun Zone puzzles.", exp:80, coins:0, icon:"▦", href:"/fun-zone", status:"available" },
  { key:"puzzle_all_eight_games", title:"Eight Ways to Play", description:"Finish at least one puzzle in each of the eight game categories.", exp:125, coins:0, icon:"✺", href:"/fun-zone", status:"available" },
  { key:"puzzle_all_thirty_two", title:"Fun Zone Master", description:"Complete all 32 unique Fun Zone puzzles.", exp:200, coins:0, icon:"✦", href:"/fun-zone", status:"available" },
];
