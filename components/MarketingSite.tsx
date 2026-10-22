import Image from "next/image";
import Link from "next/link";
import { Header } from "./Header";
import { HomeGreeting } from "./HomeGreeting";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getGuideRecords } from "@/lib/guide-store";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./PodscapeHome.module.css";

const shortcuts:{label:string;href:string;icon:PodscapeIconName;tone:string}[]=[
 {label:"Ledger",href:"/ledger",icon:"leaf",tone:"sage"},
 {label:"Shop",href:"/shop",icon:"shop",tone:"sand"},
 {label:"Fun Zone",href:"/fun-zone",icon:"creative",tone:"rose"},
 {label:"Community",href:"/from-the-lab",icon:"community",tone:"sage"},
 {label:"Guides",href:"/field-guide",icon:"book",tone:"sage"},
 {label:"PodBound",href:"/podbound",icon:"podbound",tone:"sand"}
];
type Tile={title:string;label:string;description:string;href:string;image?:string|null;alt?:string};
function TileCard({item}:{item:Tile}){return <Link href={item.href} className={styles.tile}><div className={styles.tileVisual}>{item.image?<Image src={item.image} alt={item.alt||item.title} fill sizes="(max-width: 720px) 33vw, 300px"/>:<span className={styles.tilePlaceholder}><PodscapeLineIcon name={item.label==="GUIDE"?"book":item.label==="SHOP"?"shop":"podbound"}/></span>}<span className={styles.tileTag}>{item.label}</span></div><div className={styles.tileCopy}><strong>{item.title}</strong><small>{item.description}</small><span className={styles.tileArrow} aria-hidden="true">→</span></div></Link>}
export async function MarketingSite(){
 const [records,products,guides]=await Promise.all([getSpeciesRecords(),getProductRecords(),getGuideRecords()]);
 const species=records.filter(r=>isSpeciesRecordActive(r)&&r.image).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
 const product=products.filter(p=>!p.archivedAt&&p.status==="published"&&p.image).sort((a,b)=>Number(b.featured)-Number(a.featured)||Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
 const guide=guides.filter(g=>!g.archivedAt&&g.status==="published").sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
 const hero=species[0];
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const name=user?(user.user_metadata?.first_name||user.user_metadata?.display_name||user.user_metadata?.full_name||"").split(" ")[0]:undefined;
 const featured:Tile[]=[
 ...(hero?[{title:speciesDisplayName(hero),label:"SPECIES SPOTLIGHT",description:"Discover this species in the Ledger.",href:`/ledger/${hero.slug}`,image:hero.image,alt:hero.imageAlt}]:[]),
 ...(product?[{title:product.title,label:"SHOP FEATURE",description:product.summary||"Explore our latest shop addition.",href:`/shop/${product.slug}`,image:product.image,alt:product.imageAlt}]:[]),
 {title:"Play the Demo",label:"PODBOUND",description:"Explore our isopod card game.",href:"/podbound"}
 ];
 const recent:Tile[]=[
 ...(guide?[{title:guide.title,label:"GUIDE",description:guide.summary||"Learn something new.",href:`/field-guide/${guide.slug}`}]:[]),
 {title:"Explore the Fun Zone",label:"FUN ZONE",description:"Puzzles, games and activities.",href:"/fun-zone"},
 {title:"Meet the Community",label:"COMMUNITY",description:"Connect with fellow keepers.",href:"/from-the-lab"}
 ];
 return <div className={styles.site}><a className="skip-link" href="#platform-main">Skip to content</a><Header/><main id="platform-main" className={styles.main}>
 <Link href="/account" className={styles.welcome}><span className={styles.welcomeMark}><PodscapeLineIcon name="leaf"/></span><HomeGreeting name={name}/><span className={styles.welcomeArrow}>→</span></Link>
 <section className={styles.hero} aria-label="Discover PodScape">{hero&&<Image src={hero.image!} alt={hero.imageAlt||speciesDisplayName(hero)} fill priority sizes="(max-width: 720px) 100vw, 1100px" className={styles.heroImage}/>}<div className={styles.heroContent}><span className={styles.eyebrow}>EXPLORE PODSCAPE</span><h2>Small creatures.<br/>Big world.</h2><p>Discover species, care guides, community and more.</p><Link href="/ledger" className={styles.heroButton}>Start exploring <span>→</span></Link></div></section>
 <nav className={styles.shortcuts} aria-label="Explore PodScape">{shortcuts.map(item=><Link href={item.href} className={`${styles.shortcut} ${styles[item.tone]}`} key={item.label}><span className={styles.shortcutIcon}><PodscapeLineIcon name={item.icon}/></span><span>{item.label}</span></Link>)}</nav>
 <section className={styles.section}><div className={styles.heading}><h2>Featured This Week</h2><Link href="/ledger">See all →</Link></div><div className={styles.tiles}>{featured.map(item=><TileCard item={item} key={item.href}/>)}</div></section>
 <section className={styles.section}><div className={styles.heading}><h2>Recent &amp; Noteworthy</h2><Link href="/menu">See all →</Link></div><div className={styles.tiles}>{recent.map(item=><TileCard item={item} key={item.href}/>)}</div></section>
 </main></div>;
}
