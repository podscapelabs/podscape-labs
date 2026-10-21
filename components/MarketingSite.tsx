import Image from "next/image";
import Link from "next/link";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PodboundCardRotator } from "./PodboundCardRotator";
import { SpecimenLeaf } from "./SpecimenLeaf";
import styles from "./MarketingHome.module.css";
import { isGuideActive } from "@/data/guides";
import { isLabRecordActive } from "@/data/lab";
import { formatProductPrice, isProductActive } from "@/data/products";
import { isSpeciesRecordActive, speciesDisplayName, speciesScientificName } from "@/data/species";
import { getGuideRecords } from "@/lib/guide-store";
import { getLabRecords } from "@/lib/lab-store";
import { getProductRecords } from "@/lib/product-store";
import { getSpeciesRecords } from "@/lib/species-store";

const destinations = [
  { icon: "◇", label: "Leaf Ledger", copy: "Discover species", href: "/ledger" },
  { icon: "▣", label: "My Collection", copy: "Track & manage", href: "/ledger/my-collection" },
  { icon: "▤", label: "Shop", copy: "Supplies & more", href: "/shop" },
  { icon: "⌂", label: "Vendors", copy: "Find breeders", href: "/explore#vendor-directory" },
  { icon: "◌", label: "Creative Network", copy: "Artists & makers", href: "/explore#creative-network" },
  { icon: "◎", label: "Community", copy: "Share & connect", href: "/from-the-lab" },
  { icon: "●", label: "Podlings", copy: "Your companion", href: "/explore" },
  { icon: "▧", label: "PodBound", copy: "The card game", href: "https://www.podbound.net" },
  { icon: "▥", label: "Guides", copy: "Learn & grow", href: "/field-guide" },
  { icon: "△", label: "From the Lab", copy: "Projects & updates", href: "/from-the-lab" },
] as const;

const priorityDestinations = ["Leaf Ledger", "My Collection", "Guides", "Shop", "PodBound", "Creative Network"];
const primaryDestinations = priorityDestinations.map((label) => destinations.find((item) => item.label === label)!);
const moreDestinations = destinations.filter((item) => !priorityDestinations.includes(item.label));

function SmartLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return href.startsWith("http") ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a> : <Link className={className} href={href}>{children}</Link>;
}

export async function MarketingSite() {
  const [speciesRecords, labRecords, productRecords, guideRecords] = await Promise.all([getSpeciesRecords(), getLabRecords(), getProductRecords(), getGuideRecords()]);
  const species = speciesRecords.filter((record) => isSpeciesRecordActive(record) && record.image).sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  const featuredSpecies = species[0];
  const products = productRecords.filter((record) => isProductActive(record) && record.status === "published").slice(0,4);
  const guides = guideRecords.filter((record) => isGuideActive(record) && record.status === "published").slice(0,3);
  const latestUpdate = labRecords.filter((record) => isLabRecordActive(record) && record.status === "published").sort((a,b) => Date.parse(b.publishedAt||b.updatedAt)-Date.parse(a.publishedAt||a.updatedAt))[0];

  return <div className="v2-site">
    <a className="skip-link" href="#platform-main">Skip to content</a><Header />
    <main id="platform-main">
      <section className={styles.hero} aria-labelledby="home-title"><div className={`v2-container ${styles.heroInner}`}>
        <div className={styles.heroCopy}><p className={styles.kicker}>Independent Canadian Studio</p><h1 id="home-title">Explore<br/><span>the world of isopods.</span></h1><p className={styles.tagline}>Collect. Learn. Shop. Create. Connect.</p><div className={styles.heroActions}><Link href="/explore">Start exploring <span>→</span></Link><Link href="/ledger">Browse species</Link></div></div>
        {featuredSpecies ? <Link className={styles.heroVisual} href={`/ledger/${featuredSpecies.slug}`}><span className={styles.heroNote}>Small creatures.<br/>Big world.</span><div className={styles.heroPhoto}><Image src={featuredSpecies.image!} alt={featuredSpecies.imageAlt||speciesDisplayName(featuredSpecies)} fill sizes="(max-width: 720px) 100vw, 50vw" priority style={{objectPosition:`${featuredSpecies.imagePositionX}% ${featuredSpecies.imagePositionY}%`,transform:`scale(${featuredSpecies.imageZoom})`}}/></div><span className={styles.speciesTag}><em>{speciesScientificName(featuredSpecies)}</em><strong>“{speciesDisplayName(featuredSpecies)}”</strong></span></Link> : null}
      </div></section>

      <section className={styles.destinationSection}><div className="v2-container"><div className={styles.sectionHeading}><h2>Explore Podscape</h2><Link href="/explore">All destinations →</Link></div><div className={styles.destinationGrid}>{primaryDestinations.map((item)=><SmartLink href={item.href} className={styles.destination} key={item.label}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.copy}</small></SmartLink>)}</div>
      <details className={styles.moreDestinations}><summary>More to explore <span aria-hidden="true">⌄</span></summary><div className={styles.moreDestinationGrid}>{moreDestinations.map((item)=><SmartLink href={item.href} className={styles.moreDestination} key={item.label}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.copy}</small><span aria-hidden="true">→</span></SmartLink>)}</div></details>
      </div></section>

      <section className={styles.showcase}><div className={`v2-container ${styles.showcaseGrid}`}>
        <article className={styles.speciesPanel}><div className={styles.sectionHeading}><div><h2>Featured Species</h2><p>Discover something new.</p></div><Link href="/ledger">View all →</Link></div><div className={styles.speciesRail}>{species.slice(0,4).map((record)=><Link href={`/ledger/${record.slug}`} key={record.id}><SpecimenLeaf image={record.image} alt={record.imageAlt} size="card" positionX={record.imagePositionX} positionY={record.imagePositionY} zoom={record.imageZoom}/><strong>{speciesDisplayName(record)}</strong><em>{speciesScientificName(record)}</em></Link>)}</div></article>
        <article className={styles.podbound}><div><p>Featured Project</p><Image src="/assets/logos/podbound-logo.png" alt="PodBound" width={1800} height={791}/><h2>Forecast. Choice. Colony.</h2><span>A two-player tabletop strategy game about managing an isopod colony through changing conditions.</span><a href="https://www.podbound.net" target="_blank" rel="noreferrer">Explore PodBound →</a></div><PodboundCardRotator/></article>
        <article className={styles.community}><div className={styles.sectionHeading}><div><h2>From the Community</h2><p>Keepers, creators, and colonies.</p></div><Link href="/from-the-lab">View all →</Link></div>{latestUpdate?<Link href={`/from-the-lab/${latestUpdate.slug}`} className={styles.communityFeature}>{species[1]?.image?<Image src={species[1].image!} alt="" fill sizes="420px"/>:null}<span><strong>{latestUpdate.title}</strong><small>{latestUpdate.summary}</small></span></Link>:<div className={styles.communityEmpty}>Community stories are growing here.</div>}</article>
      </div></section>

      <section className={styles.lower}><div className={`v2-container ${styles.lowerGrid}`}>
        <article><div className={styles.sectionHeading}><div><h2>Shop Highlights</h2><p>Explore supplies, enclosures and more.</p></div><Link href="/shop">View shop →</Link></div><div className={styles.productRail}>{products.length?products.map(product=><Link href={`/shop/${product.slug}`} key={product.id}>{product.image?<span><Image src={product.image} alt={product.imageAlt} fill sizes="150px"/></span>:<span className={styles.noPhoto}>Photo<br/>pending</span>}<strong>{product.title}</strong><small>{formatProductPrice(product)}</small></Link>):<p>Products are being prepared in the studio.</p>}</div></article>
        <article><div className={styles.sectionHeading}><div><h2>Creative Network</h2><p>Featured artists and makers.</p></div><Link href="/explore#creative-network">View all →</Link></div><div className={styles.creativeTiles}><Link href="/explore#creative-network"><span>◌</span><strong>Independent makers</strong></Link><Link href="/explore#creative-network"><span>◇</span><strong>Isopod artists</strong></Link><Link href="/explore#creative-network"><span>✦</span><strong>Hobby creatives</strong></Link></div></article>
        <article><div className={styles.sectionHeading}><div><h2>Guides</h2><p>Helpful resources for every keeper.</p></div><Link href="/field-guide">View all →</Link></div><div className={styles.guideList}>{guides.length?guides.map(guide=><Link href={`/field-guide/${guide.slug}`} key={guide.id}><span>◇</span><span><strong>{guide.title}</strong><small>{guide.summary}</small></span><b>›</b></Link>):<p>Guides are being prepared in the studio.</p>}</div></article>
      </div></section>
    </main>
    <nav className={styles.mobileNav} aria-label="Mobile shortcuts"><Link href="/admin/preview" aria-current="page"><span>⌂</span>Home</Link><Link href="/explore"><span>◇</span>Explore</Link><Link href="/keeper/scan" className={styles.scan}><span>▣</span>Scan</Link><Link href="/shop"><span>▤</span>Shop</Link><Link href="/account"><span>•••</span>More</Link></nav>
    <Footer />
  </div>;
}
