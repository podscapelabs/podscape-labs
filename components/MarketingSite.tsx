import Image from "next/image";
import Link from "next/link";
import { Header } from "./Header";
import styles from "./MarketingHome.module.css";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import { isSpeciesRecordActive, speciesDisplayName, speciesScientificName } from "@/data/species";
import { getSpeciesRecords } from "@/lib/species-store";

const homeDestinations = [
  { icon: "leaf", label: "Explore Species", copy: "Discover and learn about isopods.", href: "/ledger", tone: "green" },
  { icon: "book", label: "PodBound", copy: "Explore our isopod colony card game.", href: "https://www.podbound.net", tone: "sand" },
  { icon: "shop", label: "Shop", copy: "Supplies, enclosures and more.", href: "/shop", tone: "clay" },
  { icon: "book", label: "Guides & Resources", copy: "Care sheets, habitats, breeding and more.", href: "/field-guide", tone: "sage" },
  { icon: "community", label: "Community", copy: "Share, learn and connect with keepers.", href: "/from-the-lab", tone: "moss" },
] satisfies ReadonlyArray<{icon:PodscapeIconName;label:string;copy:string;href:string;tone:string}>;

export async function MarketingSite() {
  const records = await getSpeciesRecords();
  const featured = records.filter((record) => isSpeciesRecordActive(record) && record.image).sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];

  return <div className={`v2-site ${styles.site}`}>
    <a className="skip-link" href="#platform-main">Skip to content</a><Header />
    <main id="platform-main" className={styles.main}>
      <section className={styles.hero} aria-labelledby="home-title"><div className={`v2-container ${styles.heroInner}`}>
        <div className={styles.heroCopy}><p className={styles.kicker}>Independent Canadian Studio</p><h1 id="home-title">Explore<br/><span>the world<br/>of isopods.</span></h1><p className={styles.tagline}>Collect. Learn. Shop.<br/>Create. Connect.</p><div className={styles.heroActions}><Link href="/explore">Start exploring <span>→</span></Link></div></div>
        {featured ? <Link className={styles.heroVisual} href={`/ledger/${featured.slug}`} aria-label={`Explore ${speciesDisplayName(featured)}`}><div className={styles.heroPhoto}><Image src={featured.image!} alt={featured.imageAlt||speciesDisplayName(featured)} fill sizes="(max-width: 720px) 62vw, 50vw" priority style={{objectPosition:`${featured.imagePositionX}% ${featured.imagePositionY}%`,transform:`scale(${featured.imageZoom})`}}/></div><span className={styles.heroNote}>Small<br/>creatures.<br/>Big world.</span><span className={styles.speciesTag}><em>{speciesScientificName(featured)}</em><strong>“{speciesDisplayName(featured)}”</strong></span></Link> : null}
      </div></section>

      <section className={styles.homeMenu} aria-labelledby="home-menu-title"><div className="v2-container"><div className={styles.homeHeading}><h2 id="home-menu-title">Explore Podscape</h2><Link href="/menu">All destinations →</Link></div><div className={styles.homeGrid}>{homeDestinations.map((item)=><Link href={item.href} className={`${styles.homeCard} ${styles[item.tone]}`} key={item.label}><span className={styles.cardIcon}><PodscapeLineIcon name={item.icon}/></span><span><strong>{item.label}</strong><small>{item.copy}</small></span><b aria-hidden="true">›</b></Link>)}</div></div></section>
    </main>
  </div>;
}
