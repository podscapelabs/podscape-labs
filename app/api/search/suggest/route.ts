import { NextRequest, NextResponse } from "next/server";
import { getSpeciesRecords } from "@/lib/species-store";
import { getGuideRecords } from "@/lib/guide-store";
import { getProductRecords } from "@/lib/product-store";
import { getLabRecords } from "@/lib/lab-store";
import { getPodBoundCards } from "@/lib/podbound-cards";
import { isSpeciesRecordActive, speciesDisplayName, speciesScientificName } from "@/data/species";
import { isGuideActive } from "@/data/guides";
import { isProductActive } from "@/data/products";
import { isLabRecordActive } from "@/data/lab";

export const dynamic = "force-dynamic";
type Result = {title:string;subtitle:string;category:string;href:string;keywords:string;rank:number};

export async function GET(request:NextRequest){
  const query=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,90).toLocaleLowerCase();
  if(query.length<2)return NextResponse.json({results:[]});
  try{
    const [species,guides,products,notes,cards]=await Promise.all([
      getSpeciesRecords(),getGuideRecords(),getProductRecords(),getLabRecords(),getPodBoundCards()
    ]);
    const choices:Result[]=[
      ...species.filter(s=>isSpeciesRecordActive(s)&&s.kind==="species"&&s.status==="published").map(s=>({
        title:speciesDisplayName(s),subtitle:speciesScientificName(s),category:"Species",href:"/ledger/"+s.slug,
        keywords:[s.genus,s.species,s.morph,s.catalogueNumber,...s.tags].join(" "),rank:0
      })),
      ...guides.filter(g=>isGuideActive(g)&&g.status==="published").map(g=>({
        title:g.title,subtitle:g.summary,category:"Guides",href:"/field-guide/"+g.slug,keywords:g.category,rank:0
      })),
      ...products.filter(p=>isProductActive(p)&&p.status==="published").map(p=>({
        title:p.title,subtitle:p.summary,category:"Shop",href:"/shop/"+p.slug,keywords:[p.category,...p.tags].join(" "),rank:0
      })),
      ...notes.filter(n=>isLabRecordActive(n)&&n.status==="published").map(n=>({
        title:n.title,subtitle:n.summary,category:"From the Lab",href:"/from-the-lab/"+n.slug,keywords:[n.category,...n.tags].join(" "),rank:0
      })),
      ...cards.filter(c=>c.status==="published").map(c=>({
        title:c.title,subtitle:c.summary,category:"PodBound Cards",href:"/podbound/cards/"+c.id,keywords:[c.category,c.set_name,c.card_number].join(" "),rank:0
      })),
      ...[
        {title:"PodBound",subtitle:"Original isopod strategy game",category:"Explore",href:"/podbound",keywords:"game cards"},
        {title:"Fun Zone",subtitle:"Puzzles, word games and quizzes",category:"Explore",href:"/fun-zone",keywords:"play games quiz"},
        {title:"Community",subtitle:"Our growing community of keepers and creators",category:"Explore",href:"/community",keywords:"vendor trading network"},
        {title:"Manager",subtitle:"Manage colonies, bins and care",category:"Explore",href:"/keeper",keywords:"colony care scan"},
        {title:"Leaf Ledger",subtitle:"Discover isopod species",category:"Explore",href:"/ledger",keywords:"species encyclopedia"},
        {title:"Field Guide",subtitle:"Care and husbandry articles",category:"Explore",href:"/field-guide",keywords:"guides help"},
        {title:"Shop",subtitle:"Products and creations",category:"Explore",href:"/shop",keywords:"buy products"}
      ].map(item=>({...item,rank:0}))
    ];
    const matches=choices.map(item=>{
      const title=item.title.toLocaleLowerCase(),subtitle=item.subtitle.toLocaleLowerCase();
      const rank=title===query?0:title.startsWith(query)?1:title.includes(query)?2:subtitle.includes(query)?3:item.keywords.toLocaleLowerCase().includes(query)?4:99;
      return {...item,rank};
    }).filter(item=>item.rank<99).sort((a,b)=>a.rank-b.rank||a.title.localeCompare(b.title)).slice(0,10).map(({rank,keywords,...item})=>item);
    return NextResponse.json({results:matches},{headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({results:[],error:"Search is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
