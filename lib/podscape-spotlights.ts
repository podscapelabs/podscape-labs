import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getGuideRecords } from "@/lib/guide-store";
import { getLabRecords } from "@/lib/lab-store";
import { isLabRecordActive } from "@/data/lab";
import { getPodBoundCards, getPodBoundArtworkUrl } from "@/lib/podbound-cards";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";

export type Spotlight = {href:string;title:string;label:string;description:string;image:string|null;alt:string};
export async function getSpotlightOptions(): Promise<Spotlight[]> {
  const [species,products,guides,cards,notes]=await Promise.all([getSpeciesRecords(),getProductRecords(),getGuideRecords(),getPodBoundCards(),getLabRecords()]);
  const choices:Spotlight[]=[
    ...species.filter(s=>s.kind==="species"&&isSpeciesRecordActive(s)&&s.status==="published")
      .map(s=>({href:"/ledger/"+s.slug,title:speciesDisplayName(s),label:"SPECIES",description:s.summary||"Discover this species in the Leaf Ledger.",image:s.image,alt:s.imageAlt})),
    ...guides.filter(g=>!g.archivedAt&&g.status==="published")
      .map(g=>({href:"/field-guide/"+g.slug,title:g.title,label:"FIELD GUIDE",description:g.summary||"Explore this care guide.",image:null,alt:""})),
    ...products.filter(p=>!p.archivedAt&&p.status==="published")
      .map(p=>({href:"/shop/"+p.slug,title:p.title,label:"SHOP",description:p.summary||"Explore this Podscape creation.",image:p.image,alt:p.imageAlt})),
    // Platform destinations are featureable independently of individual entries.
    {href:"/ledger",title:"Leaf Ledger",label:"SPECIES ARCHIVE",description:"Discover isopod species and build your own collection.",image:null,alt:""},
    {href:"/field-guide",title:"Field Guide",label:"LEARN",description:"Browse isopod care and husbandry resources.",image:null,alt:""},
    {href:"/shop",title:"PodScape Shop",label:"SHOP",description:"Explore products and creations from PodScape Labs.",image:null,alt:""},
    {href:"/community",title:"Community",label:"COMMUNITY",description:"Find your place in the PodScape community.",image:null,alt:""},
    {href:"/from-the-lab",title:"From the Lab",label:"STUDIO",description:"Follow the projects and ideas taking shape in our studio.",image:null,alt:""},
    {href:"/podbound",title:"PodBound",label:"PODSCAPE ORIGINAL",description:"Meet the original isopod strategy game.",image:null,alt:""},
    {href:"/podbound/cards",title:"PodBound Card Gallery",label:"PODBOUND",description:"Explore our illustrated game cards.",image:null,alt:""},
    {href:"/fun-zone",title:"Fun Zone",label:"PLAY",description:"Explore puzzles, quizzes and little challenges.",image:null,alt:""},
    ...([
      ["/fun-zone/crossword-colony","Crossword Colony","Solve isopod-themed clues."],
      ["/fun-zone/colony-connections","Colony Connections","Find four hidden groups."],
      ["/fun-zone/word-burrow","Word Burrow","Guess the isopod term."],
      ["/fun-zone/species-detective","Species Detective","Identify species from clues."],
      ["/fun-zone/word-search","Word Search","Find hidden hobby terms."],
      ["/fun-zone/keepers-challenge","Keeper's Challenge","Solve practical colony scenarios."],
      ["/fun-zone/word-of-the-week","Word of the Week","Explore isopod terminology."],
      ["/fun-zone/species-quiz","Species Quiz","Test your isopod knowledge."],
    ] as const).map(([href,title,description])=>({href,title,label:"FUN ZONE GAME",description,image:null,alt:""})),
    ...notes.filter(n=>isLabRecordActive(n)&&n.status==="published")
      .map(n=>({href:"/from-the-lab/"+n.slug,title:n.title,label:"FROM THE LAB",description:n.summary||"Read the latest studio note.",image:null,alt:""})),
  ];
  for(const c of cards.filter(c=>c.status==="published"&&c.core_art_path)) {
    choices.push({href:"/podbound/cards/"+c.id,title:c.title,label:"PODBOUND CARD",description:c.summary||"Discover this card reveal.",image:await getPodBoundArtworkUrl(c.core_art_path),alt:c.core_art_alt});
  }
  return choices;
}

export async function getSpotlightSelection():Promise<string[]|null>{
  const db=getSupabaseAdmin();
  if(!db)return null;
  const {data,error}=await db.from("podscape_spotlights").select("slot,href").order("slot",{ascending:true});
  if(error)return null; // Migration not yet applied: keep homepage functional.
  return (data||[]).map(row=>String(row.href));
}

export async function getHomepageSpotlights():Promise<Spotlight[]>{
  const [options,selection]=await Promise.all([getSpotlightOptions(),getSpotlightSelection()]);
  const byHref=new Map(options.map(o=>[o.href,o]));
  // A saved editorial selection is authoritative. If it is intentionally
  // empty, or an entry is later unpublished, do NOT fill gaps with new items.
  if(selection!==null) {
    return selection.flatMap(href=>{const item=byHref.get(href);return item?[item]:[];});
  }
  // Database not available / migration missing: show stable destinations,
  // never the newest species or product as a pseudo-curated spotlight.
  return [byHref.get("/ledger"),byHref.get("/field-guide"),byHref.get("/podbound")]
    .filter((o):o is Spotlight=>Boolean(o));
}
