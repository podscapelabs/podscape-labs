import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getGuideRecords } from "@/lib/guide-store";
import { getPodBoundCards, getPodBoundArtworkUrl } from "@/lib/podbound-cards";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";

export type Spotlight = {href:string;title:string;label:string;description:string;image:string|null;alt:string};
export async function getSpotlightOptions(): Promise<Spotlight[]> {
  const [species,products,guides,cards]=await Promise.all([getSpeciesRecords(),getProductRecords(),getGuideRecords(),getPodBoundCards()]);
  const choices:Spotlight[]=[
    ...species.filter(s=>s.kind==="species"&&isSpeciesRecordActive(s)&&s.status==="published")
      .map(s=>({href:"/ledger/"+s.slug,title:speciesDisplayName(s),label:"SPECIES",description:s.summary||"Discover this species in the Leaf Ledger.",image:s.image,alt:s.imageAlt})),
    ...guides.filter(g=>!g.archivedAt&&g.status==="published")
      .map(g=>({href:"/field-guide/"+g.slug,title:g.title,label:"FIELD GUIDE",description:g.summary||"Explore this care guide.",image:null,alt:""})),
    ...products.filter(p=>!p.archivedAt&&p.status==="published")
      .map(p=>({href:"/shop/"+p.slug,title:p.title,label:"SHOP",description:p.summary||"Explore this Podscape creation.",image:p.image,alt:p.imageAlt})),
    {href:"/podbound",title:"PodBound",label:"PODSCAPE ORIGINAL",description:"Meet the original isopod strategy game.",image:null,alt:""},
    {href:"/fun-zone",title:"Fun Zone",label:"PLAY",description:"Explore puzzles, quizzes and little challenges.",image:null,alt:""},
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
  if(selection!==null) {
    const curated=selection.flatMap(href=>{const item=byHref.get(href);return item?[item]:[];});
    if(curated.length)return curated;
  }
  // Preserve a useful first-run experience before owner curation.
  return [
    options.find(o=>o.label==="SPECIES"&&o.image),
    options.find(o=>o.label==="SHOP"&&o.image),
    byHref.get("/podbound")
  ].filter((o):o is Spotlight=>Boolean(o));
}
