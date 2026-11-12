export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  exp: number;
  coins: number;
  icon: string;
  href: string;
  status: "available" | "planned";
  hidden?: boolean;
};

// Earnable achievements only reference events PodScape already records.
// Active achievements grant EXP only. Historical unlocks remain intact.
export const achievementCatalog: AchievementDefinition[] = [
  { key:"ledger_first_species", title:"First Sighting", description:"Open your first species profile in the Leaf Ledger.", exp:10, coins:0, icon:"⌕", href:"/ledger", status:"available" },
  { key:"ledger_five_species", title:"Field Observer", description:"Explore five different species in the Leaf Ledger.", exp:50, coins:0, icon:"⌕", href:"/ledger", status:"available" },
  { key:"ledger_ten_species", title:"Species Scout", description:"Explore ten different species profiles.", exp:35, coins:0, icon:"✦", href:"/ledger", status:"available" },
  { key:"ledger_twenty_species", title:"Field Naturalist", description:"Explore twenty different species profiles.", exp:75, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"ledger_fifty_species", title:"Living Encyclopedia", description:"Explore fifty different species profiles.", exp:150, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"collection_first_species", title:"First Colony", description:"Add the first species to your collection.", exp:15, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"collection_three_species", title:"Growing Collection", description:"Collect three different species.", exp:25, coins:0, icon:"✿", href:"/ledger", status:"available" },
  { key:"collection_five_species", title:"Keeper's Shelf", description:"Collect five different species.", exp:40, coins:0, icon:"❧", href:"/ledger", status:"available" },
  { key:"collection_ten_species", title:"Dedicated Keeper", description:"Collect ten different species.", exp:75, coins:0, icon:"✦", href:"/ledger", status:"available" },
  { key:"collection_twenty_species", title:"Colony Curator", description:"Collect twenty different species.", exp:125, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"collection_fifty_species", title:"Grand Collector", description:"Collect fifty different species.", exp:250, coins:0, icon:"✺", href:"/ledger", status:"available" },
  { key:"onboarding_complete", title:"Welcome to PodScape", description:"Complete your first PodScape tour.", exp:35, coins:0, icon:"✧", href:"/app", status:"available" },
  { key:"home_personalized", title:"Make It Yours", description:"Make the Home dashboard your own.", exp:20, coins:0, icon:"❧", href:"/app", status:"available" },
  { key:"nav_personalized", title:"Shortcut Architect", description:"Arrange the shortcuts you use most.", exp:20, coins:0, icon:"⠿", href:"/app", status:"available" },
  { key:"species_personalized", title:"Ledger Designer", description:"Give a species profile your own layout.", exp:25, coins:0, icon:"⌕", href:"/ledger", status:"available" },
  { key:"manager_personalized", title:"Keeper's Workspace", description:"Make the Manager dashboard fit your keeping routine.", exp:25, coins:0, icon:"▦", href:"/keeper", status:"available" },
  { key:"customize_three", title:"Your Little World", description:"Make three PodScape spaces your own.", exp:60, coins:0, icon:"✿", href:"/app", status:"available" },
  { key:"secret_two_paths", title:"A Curious Little Detour", description:"You found an unexpected connection between your personal spaces.", exp:20, coins:0, icon:"✧", href:"/account/progress", status:"available", hidden:true },
  { key:"secret_first_steps", title:"The Hidden Trail", description:"A small surprise for making PodScape your own.", exp:30, coins:0, icon:"❧", href:"/account/progress", status:"available", hidden:true },
  { key:"customize_all", title:"The PodScape Touch", description:"Personalize Home, shortcuts, Species and Manager.", exp:100, coins:0, icon:"✺", href:"/account/progress", status:"available", hidden:true },
  { key:"care_journal", title:"Care Journal", description:"Record five care activities across at least three days.", exp:35, coins:0, icon:"▤", href:"/keeper", status:"available" },
  { key:"puzzle_pathfinder", title:"Puzzle Pathfinder", description:"Complete your first Fun Zone puzzle.", exp:10, coins:0, icon:"◇", href:"/fun-zone", status:"available" },
  { key:"puzzle_five", title:"Little Problem Solver", description:"Solve five different Fun Zone puzzles.", exp:30, coins:0, icon:"✧", href:"/fun-zone", status:"available" },
  { key:"puzzle_sixteen", title:"Puzzle Explorer", description:"Solve sixteen different Fun Zone puzzles.", exp:80, coins:0, icon:"▦", href:"/fun-zone", status:"available" },
  { key:"puzzle_all_eight_games", title:"Eight Ways to Play", description:"Complete at least one puzzle in each of the eight tracked games.", exp:125, coins:0, icon:"✺", href:"/fun-zone", status:"available" },
  { key:"puzzle_all_thirty_two", title:"Fun Zone Master", description:"Complete the full thirty-two-puzzle arcade collection.", exp:200, coins:0, icon:"✦", href:"/fun-zone", status:"available" },
  { key:"exchange_first_trade", title:"First Quack on Wall Street", description:"Place your first trade on The Pod Exchange.", exp:15, coins:0, icon:"◇", href:"/fun-zone/pod-exchange", status:"available" },
  { key:"exchange_first_sale", title:"Paper Wings", description:"Make your first sale in the fictional stock market.", exp:20, coins:0, icon:"✧", href:"/fun-zone/pod-exchange", status:"available" },
  { key:"exchange_five_trades", title:"Tiny Trader", description:"Complete five Pod Exchange trades.", exp:30, coins:0, icon:"▦", href:"/fun-zone/pod-exchange", status:"available" },
  { key:"exchange_three_companies", title:"Diversified Burrow", description:"Trade shares in three different fictional companies.", exp:35, coins:0, icon:"❧", href:"/fun-zone/pod-exchange", status:"available" },
  { key:"exchange_fifteen_trades", title:"The Big Quacker", description:"Complete fifteen Pod Exchange trades.", exp:60, coins:0, icon:"✺", href:"/fun-zone/pod-exchange", status:"available" },
  // Market Rankings placements are verified only at the weekly Monday checkpoint.
  { key:"exchange_market_mogul", title:"Market Mogul", description:"Lead The Rich List with a profitable portfolio at a competitive weekly checkpoint.", exp:150, coins:0, icon:"✺", href:"/fun-zone/pod-exchange/rankings", status:"available" },
  { key:"exchange_sharp_trader", title:"Sharp Investor", description:"Top the investor-return board with at least 10% growth at a weekly checkpoint.", exp:125, coins:0, icon:"✦", href:"/fun-zone/pod-exchange/rankings", status:"available" },
  { key:"exchange_weekly_mover", title:"The Bell Tolls for Moss", description:"Lead a competitive Market Movers week with at least 5% growth.", exp:100, coins:0, icon:"✧", href:"/fun-zone/pod-exchange/rankings", status:"available", hidden:true },
  // Level milestones are permanent and use lifetime EXP, even after future Molt cycles.
  { key:"level_ten", title:"Finding Your Feet", description:"Reach Keeper Level 10.", exp:50, coins:0, icon:"✦", href:"/account/progress", status:"available" },
  { key:"level_twenty_five", title:"Seasoned Keeper", description:"Reach Keeper Level 25.", exp:150, coins:0, icon:"✺", href:"/account/progress", status:"available" },
  { key:"level_fifty", title:"Among the Ancients", description:"Reach Keeper Level 50.", exp:300, coins:0, icon:"✺", href:"/account/progress", status:"available", hidden:true },
  // Keeper and puzzle milestones use verified server-side records.
  { key:"keeper_first_enclosure", title:"A Little World", description:"Create your first enclosure in Manager.", exp:15, coins:0, icon:"▤", href:"/keeper", status:"available" },
  { key:"keeper_five_enclosures", title:"Room to Roam", description:"Create five different enclosures in Manager.", exp:60, coins:0, icon:"▦", href:"/keeper", status:"available" },
  { key:"keeper_first_care", title:"First Check-In", description:"Record your first colony care activity.", exp:15, coins:0, icon:"❧", href:"/keeper", status:"available" },
  { key:"puzzle_three_games", title:"Game Hopper", description:"Complete at least one puzzle in three different Fun Zone games.", exp:35, coins:0, icon:"◇", href:"/fun-zone", status:"available" },
  { key:"puzzle_twenty_four", title:"Puzzle Veteran", description:"Complete twenty-four different Fun Zone puzzles.", exp:110, coins:0, icon:"✦", href:"/fun-zone", status:"available" },
  { key:"secret_burrow_explorer", title:"Deep in the Litter", description:"Complete three different Word Burrow puzzles.", exp:40, coins:0, icon:"✧", href:"/fun-zone/word-burrow", status:"available", hidden:true },
  // Permanent podium achievements; their EXP comes from the transactional ranking-award ledger.
  { key:"ranking_first_podium", title:"A Place on the Podium", description:"Finish in the top three of a qualifying arcade ranking.", exp:0, coins:0, icon:"✦", href:"/fun-zone/leaderboard", status:"available" },
  { key:"ranking_weekly_champion", title:"Crowned for a Week", description:"Finish first on a qualifying weekly arcade board.", exp:0, coins:0, icon:"✺", href:"/fun-zone/leaderboard", status:"available" },
  { key:"ranking_three_wins", title:"Three-Peat", description:"Claim first place across three completed ranking periods.", exp:0, coins:0, icon:"✧", href:"/fun-zone/leaderboard", status:"available", hidden:true },
  { key:"ranking_alltime_top", title:"Arcade Legend", description:"Reach first place on a qualifying all-time leaderboard.", exp:0, coins:0, icon:"✺", href:"/fun-zone/leaderboard", status:"available", hidden:true },
  // Future surprises are intentionally not earnable until server-side proof exists.
  { key:"care_seven_days", title:"Seven Days of Care", description:"Record care activity on seven different UTC days.", exp:80, coins:0, icon:"❧", href:"/keeper", status:"available" },
  { key:"collection_twenty_five_species", title:"The Leaf Collector", description:"Add twenty-five different species to your collection.", exp:175, coins:0, icon:"✿", href:"/ledger", status:"available" },
  { key:"secret_arcade_variety", title:"Curious by Nature", description:"Complete puzzles in four different Fun Zone games.", exp:45, coins:0, icon:"◇", href:"/fun-zone", status:"available", hidden:true },
  { key:"secret_burrow_streak", title:"Just One More", description:"Complete puzzles on three different UTC days.", exp:40, coins:0, icon:"✧", href:"/fun-zone", status:"available", hidden:true },
];
