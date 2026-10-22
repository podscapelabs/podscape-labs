import Image from "next/image";
import Link from "next/link";
import { Header } from "./Header";
import { HomeGreeting } from "./HomeGreeting";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import { getSpeciesRecords } from "@/lib/species-store";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { customerSupabase } from "@/lib/customer-auth/server";
import styles from "./PodscapeHome.module.css";

const shortcuts: {label:string;href:string;icon:PodscapeIconName;tone:string}[]=[
 {label:"Species",href:"/ledger",icon:"leaf",tone:"sage"},
 {label:"Ledger",href:"/ledger",icon:"book",tone:"sage"},
 {label:"Shop",href:"/shop",icon:"shop",tone:"sand"},
 {label:"Fun Zone",href:"/fun-zone",icon:"creative",tone:"rose"},
 {label:"Community",href:"/from-the-lab",icon:"community",tone:"sage"},
 {label:"Guides",href:"/field-guide",icon:"book",tone:"sage"},
 {label:"PodBound",href:"/podbound",icon:"podbound",tone:"sand"}
];
export async function MarketingSite(){
 const records=await getSpeciesRecords();
 const featured=records.filter(r=>isSpeciesRecordActive(r)&&r.image).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
 const hero=featured[0];
 const db=await customerSupabase();
 const {data:{user}}=db?await db.auth.getUser():{data:{user:null}};
 const name=user?(user.user_metadata?.first_name||user.user_metadata?.display_name||user.user_metadata?.full_name||user.email?.split("@")[0]||"").split(" ")[0]:undefined;
 return <div className={styles.site}><a className="skip-link" href="#platform-main">Skip to content</a><Header/>
 <main id="platform-main" className={styles.main}>
 <div className={styles.greeting}><HomeGreeting name={name}/></div>
 <section className={styles.hero} aria-label="Discover PodScape">
 {hero&&<Image src={hero.image!} alt={hero.imageAlt||speciesDisplayName(hero)} fill priority sizes="(max-width: 720px) 100vw, 1000px" className={styles.heroImage} style={{objectPosition:`${hero.imagePositionX}% ${hero.imagePositionY}%`}}/>}
 <div className={styles.heroContent}><span className={styles.eyebrow}>EXPLORE PODSCAPE</span><h2>Discover the world of isopods.</h2><p>Species, care guides, community and so much more.</p><Link href="/ledger" className={styles.heroButton}>Start exploring <span>→</span></Link></div>
 <div className={styles.dots} aria-hidden="true"><span/><span/><span/></div>
 </section>
 <nav className={styles.shortcuts} aria-label="Explore PodScape">{shortcuts.map(item=><Link href={item.href} className={`${styles.shortcut} ${styles[item.tone]}`} key={item.label}><span className={styles.shortcutIcon}><PodscapeLineIcon name={item.icon}/></span><span>{item.label}</span></Link>)}</nav>
 <section className={styles.section}><div className={styles.heading}><h2>Featured This Week</h2><Link href="/ledger">See all →</Link></div>
 {hero?<Link href={`/ledger/${hero.slug}`} className={styles.feature}><div className={styles.featureImage}><Image src={hero.image!} alt={hero.imageAlt||speciesDisplayName(hero)} fill sizes="(max-width: 720px) 48vw, 360px"/></div><div className={styles.featureCopy}><span className={styles.eyebrow}>SPECIES SPOTLIGHT</span><h3>{speciesDisplayName(hero)}</h3><p>Meet one of the fascinating species in our growing Ledger.</p><span className={styles.featureLink}>Explore species →</span></div></Link>:<div className={styles.empty}>New species spotlights are on their way.</div>}
 </section>
 <section className={styles.section}><div className={styles.heading}><h2>More to Explore</h2><Link href="/menu">See all →</Link></div><div className={styles.more}>
 <Link href="/field-guide"><span className={styles.moreIcon}><PodscapeLineIcon name="book"/></span><strong>Care Guides</strong><small>Learn something new</small><b>→</b></Link>
 <Link href="/fun-zone"><span className={styles.moreIcon}><PodscapeLineIcon name="creative"/></span><strong>Fun Zone</strong><small>Play and explore</small><b>→</b></Link>
 <Link href="/podbound"><span className={styles.moreIcon}><PodscapeLineIcon name="podbound"/></span><strong>PodBound</strong><small>Explore the card game</small><b>→</b></Link>
 </div></section>
 </main></div>;
}
