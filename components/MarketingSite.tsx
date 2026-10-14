import Image from "next/image";
import Link from "next/link";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ArrowUpRightIcon } from "./Icons";
import { LedgerSpeciesCard } from "./LedgerSpeciesCard";
import { BookIcon, LeafIcon, ShopIcon } from "./PlatformIcons";
import { PodboundCardRotator } from "./PodboundCardRotator";
import { SpecimenLeaf } from "./SpecimenLeaf";
import styles from "./MarketingHome.module.css";
import { isLabRecordActive, labRecordDate } from "@/data/lab";
import { isSpeciesRecordActive, speciesDisplayName } from "@/data/species";
import { getLabRecords } from "@/lib/lab-store";
import { getSpeciesRecords } from "@/lib/species-store";

export async function MarketingSite() {
  const [speciesRecords, labRecords] = await Promise.all([getSpeciesRecords(), getLabRecords()]);
  const ledgerRecords = speciesRecords
    .filter((record) => isSpeciesRecordActive(record) && record.image)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5);
  // Preview the eventual customer-facing layout: never highlight unpublished drafts.
  const latestUpdates = labRecords
    .filter((record) => isLabRecordActive(record) && record.status === "published")
    .sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt))
    .slice(0, 3);
  const featuredSpecies = ledgerRecords[0];

  return <div className="v2-site">
    <a className="skip-link" href="#platform-main">Skip to content</a>
    <Header />
    <main id="platform-main">
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`v2-container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Podscape Labs · Independent Canadian Studio</p>
            <h1 id="home-title">Explore the world of isopods.</h1>
            <p className={styles.description}>Original games, species knowledge, and practical resources for curious keepers.</p>
          </div>
          {featuredSpecies ? <Link className={styles.heroFeature} href={`/ledger/${featuredSpecies.slug}`} aria-label={`View ${speciesDisplayName(featuredSpecies)} in Leaf Ledger`}>
            <span className={styles.heroFeatureLabel}>From the Leaf Ledger</span>
            <SpecimenLeaf image={featuredSpecies.image} alt={featuredSpecies.imageAlt || "Isopod specimen photograph"} size="hero" positionX={featuredSpecies.imagePositionX} positionY={featuredSpecies.imagePositionY} zoom={featuredSpecies.imageZoom} />
            <span className={styles.heroFeatureFoot}>Explore species <span aria-hidden="true">↗</span></span>
          </Link> : null}
        </div>
      </section>

      <section className={styles.discover} aria-labelledby="start-exploring-title">
        <div className="v2-container">
          <div className={styles.sectionHeading}>
            <h2 id="start-exploring-title">Start exploring</h2>
            <Link href="/explore">All destinations <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.quickGrid}>
            <Link href="/ledger" className={styles.quickCard}>
              <span className={styles.quickIcon}><LeafIcon /></span>
              <strong>Leaf Ledger</strong>
              <span className={styles.quickDescription}>Species and collections</span>
              <span className={styles.quickArrow} aria-hidden="true">↗</span>
            </Link>
            <Link href="/field-guide" className={styles.quickCard}>
              <span className={styles.quickIcon}><BookIcon /></span>
              <strong>Field Guide</strong>
              <span className={styles.quickDescription}>Care and husbandry</span>
              <span className={styles.quickArrow} aria-hidden="true">↗</span>
            </Link>
            <Link href="/shop" className={styles.quickCard}>
              <span className={styles.quickIcon}><ShopIcon /></span>
              <strong>Shop</strong>
              <span className={styles.quickDescription}>Catalogue preview · checkout offline</span>
              <span className={styles.quickArrow} aria-hidden="true">↗</span>
            </Link>
            <Link href="/from-the-lab" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <svg aria-hidden="true" viewBox="0 0 32 32">
                  <path d="M12 3.5h8M14 3.5V13L7.2 24.7a3.1 3.1 0 0 0 2.7 4.6h12.2a3.1 3.1 0 0 0 2.7-4.6L18 13V3.5"/>
                  <path d="M10 23h12M14 18h5"/>
                </svg>
              </span>
              <strong>From the Lab</strong>
              <span className={styles.quickDescription}>Projects and studio updates</span>
              <span className={styles.quickArrow} aria-hidden="true">↗</span>
            </Link>
          </div>
          <article className={styles.podboundFeature} aria-labelledby="featured-podbound-title">
            <div className={styles.podboundCopy}>
              <p className={styles.podboundKicker}>Featured project · PodBound</p>
              <Image className={styles.podboundLogo} src="/assets/logos/podbound-logo.png" alt="PodBound" width={1800} height={791} />
              <h2 id="featured-podbound-title">Forecast. Choice. Colony.</h2>
              <p>A two-player tabletop strategy game about managing an isopod colony through changing conditions.</p>
              <a href="https://www.podbound.net" className={styles.podboundLink} target="_blank" rel="noreferrer">Explore PodBound <ArrowUpRightIcon /></a>
            </div>
            <div className={styles.podboundCards}><PodboundCardRotator /></div>
          </article>
        </div>
      </section>

      {ledgerRecords.length ? <section className={styles.contentSection} aria-labelledby="latest-ledger-title">
        <div className="v2-container">
          <div className={styles.sectionHeading}>
            <h2 id="latest-ledger-title">From the Leaf Ledger</h2>
            <Link href="/ledger">Browse species <span aria-hidden="true">→</span></Link>
          </div>
          <div className={`v2-species-rail ${styles.speciesRail}`}>
            {ledgerRecords.map((record) => <LedgerSpeciesCard record={record} compact key={record.id} />)}
          </div>
        </div>
      </section> : null}

      {latestUpdates.length ? <section className={styles.contentSection} aria-labelledby="studio-updates-title">
        <div className="v2-container">
          <div className={styles.sectionHeading}>
            <h2 id="studio-updates-title">From the Lab</h2>
            <Link href="/from-the-lab">All updates <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.updateGrid}>
            {latestUpdates.map((update) => <Link className={styles.updateCard} href={`/from-the-lab/${update.slug}`} key={update.id}>
              <span>{update.category}</span>
              <strong>{update.title}</strong>
              <p>{update.summary || "Studio update"}</p>
              <small>{labRecordDate(update)}</small>
            </Link>)}
          </div>
        </div>
      </section> : null}
    </main>
    <Footer />
  </div>;
}
