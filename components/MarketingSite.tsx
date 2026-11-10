import Image from "next/image";
import Link from "next/link";
import { Header } from "./Header";
import { HomeGreeting } from "./HomeGreeting";
import { HomeSearch } from "./HomeSearch";
import { PodscapeLineIcon } from "./PodscapeLineIcon";
import { CustomizableHomeShortcuts } from "./CustomizableHomeShortcuts";
import { HomeWidgets, type HomeColony, type HomeProgress } from "./HomeWidgets";
import type { RecentGroup } from "./RecentCategoryCards";
import {getPublishedUpdates} from "@/lib/podscape-updates";
import {getSupabaseAdmin} from "@/lib/supabase-admin";
import type { PinOption } from "./home-pins";
import { games as funZoneGames } from "@/lib/fun-zone-games";
import { InstallPodscape } from "./InstallPodscape";
import { ShortcutWelcomeTip } from "./ShortcutWelcomeTip";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getGuideRecords } from "@/lib/guide-store";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { customerSupabase } from "@/lib/customer-auth/server";
import { getHomepageSpotlights } from "@/lib/podscape-spotlights";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import styles from "./PodscapeHome.module.css";

type Tile={title:string;label:string;description:string;href:string;image?:string|null;alt?:string};
function TileCard({item}:{item:Tile}){return <Link href={item.href} className={styles.tile}><div className={styles.tileVisual}>{item.image?<Image src={item.image} alt={item.alt||item.title} fill sizes="(max-width: 720px) 33vw, 300px"/>:<span className={styles.tilePlaceholder}><PodscapeLineIcon name={item.label==="GUIDE"?"book":item.label==="SHOP"?"shop":"podbound"}/></span>}<span className={styles.tileTag}>{item.label}</span></div><div className={styles.tileCopy}><strong>{item.title}</strong><small>{item.description}</small><span className={styles.tileArrow} aria-hidden="true">→</span></div></Link>}
export async function MarketingSite(){
 const [records,products,guides,spotlights,isOwner]=await Promise.all([getSpeciesRecords(),getProductRecords(),getGuideRecords(),getHomepageSpotlights(),isAdminAuthenticated()]);
 const species=records.filter(r=>isSpeciesRecordActive(r)&&r.image).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
 const hero=species[0];
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const {data:profile}=user&&db?await db.from("customer_profiles").select("display_name").eq("id",user.id).maybeSingle():{data:null};
 const name=(profile?.display_name||user?.user_metadata?.display_name||user?.user_metadata?.full_name||"").trim().split(/\s+/)[0]||undefined;
 let colony:HomeColony=null;
 let ownedPins:PinOption[]=[];
 let progress:HomeProgress=null;
 if(user&&db){
  const [colonyResult,progressResult,ownedResult]=await Promise.all([
    db.from("keeper_enclosures").select("id,name,species_id,quantity").eq("user_id",user.id).eq("is_archived",false).order("updated_at",{ascending:false}).limit(1).maybeSingle(),
    db.from("member_progress").select("total_exp").eq("user_id",user.id).maybeSingle(),
    db.from("keeper_enclosures").select("id,name,species_id,quantity").eq("user_id",user.id).eq("is_archived",false)
  ]);
  if(colonyResult.data){
    const entry=colonyResult.data;
    const matched=records.find(record=>record.id===entry.species_id);
    colony={id:entry.id,name:entry.name,quantity:entry.quantity||0,speciesName:matched?speciesDisplayName(matched):"Your colony"};
  }
  ownedPins=(ownedResult.data||[]).map(entry=>{
    const matched=records.find(record=>record.id===entry.species_id);
    return {kind:"colony" as const,id:entry.id,title:entry.name,description:(matched?speciesDisplayName(matched):"Colony")+" · "+(entry.quantity||0)+" recorded",href:"/keeper/"+entry.id};
  });
  if(progressResult.data){
    const exp=Math.max(0,Number(progressResult.data.total_exp||0));
    progress={level:Math.floor(Math.sqrt(exp/100))+1,exp};
  }
 }

 const pinOptions:PinOption[]=[
  ...records.filter(record=>isSpeciesRecordActive(record)&&record.kind==="species"&&record.status==="published").map(record=>({kind:"species" as const,id:record.slug,title:speciesDisplayName(record),description:record.summary||"Discover this species",href:"/ledger/"+record.slug})),
  ...ownedPins,
  ...funZoneGames.map(game=>({kind:"game" as const,id:game.key,title:game.title,description:game.subtitle,href:"/fun-zone/"+game.key})),
  {kind:"game",id:"word-search",title:"Word Search",description:"Find hidden isopod terms",href:"/fun-zone/word-search"}
 ];
 const featured:Tile[]=spotlights.map(item=>({title:item.title,label:item.label,description:item.description,href:item.href,image:item.image,alt:item.alt}));
 // Automatic catalogue activity stays separate from manually curated platform announcements.
 // All updates must be published before they are eligible for the Home feed.
 const admin=getSupabaseAdmin();
 const [announcements,vendorResult]=await Promise.all([
  getPublishedUpdates(),
  admin?admin.from("vendor_profiles").select("id,business_name,tagline,reviewed_at").eq("status","approved").order("reviewed_at",{ascending:false}).limit(20):Promise.resolve({data:null,error:null})
 ]);
 type Entry={category:RecentGroup["category"];title:string;description:string;href:string;updatedAt:string};
 const recentEntries:Entry[]=[
  ...records.filter(r=>r.kind==="species"&&r.status==="published"&&isSpeciesRecordActive(r))
   .map(r=>({category:"leaf_ledger" as const,title:speciesDisplayName(r),description:r.summary||"Explore this species in Leaf Ledger.",href:"/ledger/"+r.slug,updatedAt:r.updatedAt})),
  ...guides.filter(g=>!g.archivedAt&&g.status==="published")
   .map(g=>({category:"field_guide" as const,title:g.title,description:g.summary||"Read this PodScape Field Guide article.",href:"/field-guide/"+g.slug,updatedAt:g.updatedAt})),
  ...products.filter(p=>!p.archivedAt&&p.status==="published")
   .map(p=>({category:"shop_vendors" as const,title:p.title,description:p.summary||"See this product in the Shop.",href:"/shop/"+p.slug,updatedAt:p.updatedAt})),
  ...(vendorResult.data||[]).filter(v=>v.reviewed_at).map(v=>({
   category:"shop_vendors" as const,title:v.business_name+" joined the directory",
   description:v.tagline||"Meet this independent vendor in the PodScape directory.",
   href:"/shop/vendors",updatedAt:v.reviewed_at as string
  })),
  ...announcements.filter(a=>a.published_at).map(a=>({
   category:a.category,title:a.title,description:a.summary,href:a.href,updatedAt:a.published_at!
  }))
 ];
 const categories:RecentGroup["category"][]=["leaf_ledger","whats_improved","new_features","field_guide","shop_vendors","fun_podbound"];
 const recentGroups:RecentGroup[]=categories.flatMap(category=>{
  const seen=new Set<string>();
  const items=recentEntries.filter(item=>item.category===category&&Number.isFinite(Date.parse(item.updatedAt)))
   .sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)||a.title.localeCompare(b.title))
   .filter(item=>{const key=item.title+"|"+item.href;if(seen.has(key))return false;seen.add(key);return true;});
  if(!items.length)return [];
  const newestAt=items[0].updatedAt;
  // Batch related edits within 48 hours without letting any category take more than one card.
  const batch=items.filter(item=>Date.parse(newestAt)-Date.parse(item.updatedAt)<=48*60*60*1000).slice(0,12);
  return [{category,newestAt,items:batch.map(({title,description,href})=>({title,description,href}))}];
 }).sort((a,b)=>Date.parse(b.newestAt)-Date.parse(a.newestAt));
 return <div className={styles.site}><a className="skip-link" href="#platform-main">Skip to content</a><Header/><main id="platform-main" className={styles.main}>
 <HomeWidgets recentGroups={recentGroups} colony={colony} progress={progress} pinOptions={pinOptions} userId={user?.id||null}
  greeting={<div className={styles.greetingWorkspace}><div className={styles.homeGreetingRow}><Link href="/account" className={styles.welcome}><span className={styles.welcomeMark}><PodscapeLineIcon name="leaf"/></span><HomeGreeting name={name}/><span className={styles.welcomeArrow}>→</span></Link></div><HomeSearch/></div>}
  hero={<section className={styles.hero} aria-label="Discover PodScape">{hero&&<Image src={hero.image!} alt={hero.imageAlt||speciesDisplayName(hero)} fill priority sizes="(max-width: 720px) 100vw, 1100px" className={styles.heroImage}/>}<div className={styles.heroContent}><span className={styles.eyebrow}>EXPLORE PODSCAPE</span><h2>Small creatures.<br/>Big world.</h2><p>Discover species, care guides, community and more.</p></div></section>}
  shortcuts={<><CustomizableHomeShortcuts isOwner={isOwner}/><ShortcutWelcomeTip userId={user?.id||null}/><InstallPodscape/></>}
  spotlight={featured.length ? <section className={styles.section} aria-label="PodScape Spotlight"><div className={styles.heading}><h2>PodScape Spotlight</h2><span className={styles.spotlightHint}>Swipe to explore <span aria-hidden="true">↔</span></span></div><div className={styles.spotlightRail} role="region" aria-roledescription="carousel" aria-label="Curated PodScape highlights" tabIndex={0}>{featured.map(item=><TileCard item={item} key={item.href}/>)}</div></section> : null}
 />
 </main></div>;
}
