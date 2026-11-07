import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { formatProductPrice } from "@/data/products";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "PodBound | A PodScape Labs Original",
  description: "Meet PodBound, an original isopod strategy card game. Explore the game, its artwork, the real species behind it, and the latest studio creations.",
};

const destinations = [
  { icon: "podbound" as const, title: "The Game", description: "Discover the world of PodBound.", href: "#the-game", ready: true },
  { icon: "book" as const, title: "How to Play", description: "Rules and strategies are being prepared.", href: "", ready: false },
  { icon: "leaf" as const, title: "Card Catalogue", description: "Species cards and artwork are coming.", href: "", ready: false },
  { icon: "creative" as const, title: "Simulator", description: "The playable simulator is moving here.", href: "", ready: false },
];

export default async function PodBoundHome() {
  const [speciesRecords, productRecords] = await Promise.all([getSpeciesRecords(), getProductRecords()]);
  const featuredSpecies = speciesRecords.find((species) =>
    species.kind === "species" && isSpeciesRecordActive(species) && species.status === "published" &&
    /dairy cow/i.test(species.commonName) && Boolean(species.image)
  ) || speciesRecords.find((species) => species.kind === "species" && isSpeciesRecordActive(species) && species.status === "published" && Boolean(species.image));
  const podBoundProducts = productRecords.filter((product) =>
    !product.archivedAt && product.status === "published" &&
    (product.title.toLowerCase().includes("podbound") || product.tags.some((tag) => tag.toLowerCase().includes("podbound")))
  ).sort((a, b) => Number(b.featured) - Number(a.featured) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const product = podBoundProducts[0];

  return <div className={styles.site}>
    <a className="skip-link" href="#platform-main">Skip to content</a>
    <Header />
    <main id="platform-main" className={styles.main}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/app">PodScape Home</Link><span aria-hidden="true">/</span><span>PodBound</span></nav>
      <section className={styles.intro} aria-label="Welcome to PodBound">
        <span className={styles.introMark}><PodscapeLineIcon name="podbound" /></span>
        <div><p className={styles.introEyebrow}>A PODSCAPE LABS ORIGINAL</p><h1>Welcome to PodBound <span aria-hidden="true">✦</span></h1><p>Your next little adventure starts here.</p></div>
      </section>

      <section className={styles.hero} aria-labelledby="game-title">
        <div className={styles.heroArt} aria-hidden="true"><span className={styles.cardBack}><PodscapeLineIcon name="podbound" /></span><span className={styles.cardFront}><PodscapeLineIcon name="leaf" /></span><span className={styles.heroDecoration}>✧</span></div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>SMALL CREATURES. BIG DECISIONS.</p>
          <h2 id="game-title">PodBound</h2>
          <p>Build your colony. Navigate changing environments. Discover a strategy card game inspired by the incredible lives of isopods.</p>
          <a className={styles.heroButton} href="#the-game">Discover the game <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="explore-title">
        <div className={styles.heading}><h2 id="explore-title">Explore PodBound</h2><span>One little world. Plenty to discover.</span></div>
        <div className={styles.destinations}>
          {destinations.map((item) => <div className={styles.destination} key={item.title}>
            <span className={styles.destinationIcon}><PodscapeLineIcon name={item.icon} /></span>
            <h3>{item.title}</h3><p>{item.description}</p>
            {item.ready ? <a href={item.href} className={styles.destinationArrow} aria-label={"Explore " + item.title}>→</a> :
              <span className={styles.soon}>Coming soon</span>}
          </div>)}
        </div>
      </section>

      <section id="the-game" className={styles.story} aria-labelledby="story-title">
        <p className={styles.smallLabel}>MEET THE GAME</p>
        <h2 id="story-title">A whole ecosystem in your hands.</h2>
        <p>In PodBound, the smallest creatures face big challenges. Choose your species, respond to the environment, and make every decision count. It's a tabletop strategy game with real isopod biology at its heart.</p>
        <span className={styles.storyFooter}><PodscapeLineIcon name="podbound" /> Created with curiosity at PodScape Labs.</span>
      </section>

      <section className={styles.section} aria-labelledby="shop-title">
        <div className={styles.heading}><h2 id="shop-title">Shop PodBound</h2><Link href="/shop">Explore the Shop →</Link></div>
        {product ? <Link href={`/shop/${product.slug}`} className={styles.productCard}>
          <span className={styles.productImage}>{product.image ? <Image src={product.image} alt={product.imageAlt || product.title} fill sizes="(max-width: 700px) 35vw, 350px" style={{objectFit:"cover"}} /> : <PodscapeLineIcon name="shop" />}</span>
          <span className={styles.productCopy}><small>FROM THE PODSCAPE SHOP</small><strong>{product.title}</strong><span>{product.summary || "Explore the latest PodBound creation."}</span><em>{formatProductPrice(product)} CAD</em></span>
          <span className={styles.productArrow} aria-hidden="true">→</span>
        </Link> : <div className={styles.shopEmpty}><span className={styles.shopIcon}><PodscapeLineIcon name="shop" /></span><div><strong>The PodBound collection is taking shape.</strong><p>Game releases, artwork, and accessories will appear here as they are ready.</p></div><Link href="/shop">Browse PodScape Shop →</Link></div>}
        <p className={styles.shopNote}>PodBound products live in the same PodScape shop. Checkout is still in development.</p>
      </section>

      <section className={styles.section} aria-labelledby="ledger-title">
        <div className={styles.heading}><h2 id="ledger-title">From the Leaf Ledger</h2><Link href="/ledger">Explore the Ledger →</Link></div>
        <div className={styles.ledgerCard}>
          <div className={styles.speciesImage}>{featuredSpecies?.image ? <Image src={featuredSpecies.image} alt={featuredSpecies.imageAlt || speciesDisplayName(featuredSpecies)} fill sizes="(max-width: 700px) 35vw, 350px" style={{objectFit:"cover"}}/> : <PodscapeLineIcon name="leaf" />}</div>
          <div className={styles.ledgerCopy}><small>REAL SPECIES. REAL INSPIRATION.</small><h3>{featuredSpecies ? speciesDisplayName(featuredSpecies) : "Meet the creatures behind the cards"}</h3><p>Every PodBound species has a real story. Discover the animals, habitats and natural history that inspire the game.</p><Link href={featuredSpecies ? `/ledger/${featuredSpecies.slug}` : "/ledger"}>Meet the real species →</Link></div>
          <div className={styles.ledgerCardMotif} aria-hidden="true"><PodscapeLineIcon name="podbound" /><span>Card catalogue connection coming soon</span></div>
        </div>
      </section>

      <section className={styles.studio} aria-labelledby="studio-title">
        <div><p className={styles.smallLabel}>FROM THE STUDIO</p><h2 id="studio-title">Still growing, one card at a time.</h2><p>Rules, card reveals, artwork collections, and the simulator will join this space as development continues.</p></div>
        <Link href="/app">Back to PodScape <span aria-hidden="true">→</span></Link>
      </section>
    </main>
    <Footer />
  </div>;
}
