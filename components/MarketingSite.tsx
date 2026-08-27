import Image from "next/image";
import Link from "next/link";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { ArrowUpRightIcon } from "./Icons";
import { BookIcon, CreativeIcon, DirectoryIcon, GameIcon, LeafIcon } from "./PlatformIcons";
import { PodboundCardRotator } from "./PodboundCardRotator";
import { SpecimenLeaf } from "./SpecimenLeaf";
import { labBench, platformAreas, updates, type PlatformArea } from "@/data/platform";
import { specimenPhotoTests } from "@/data/photo-tests";

const areaIcons: Record<PlatformArea["key"], React.ReactNode> = {
  ledger: <LeafIcon />, podbound: <GameIcon />, guide: <BookIcon />, creative: <CreativeIcon />, directory: <DirectoryIcon />,
};

function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return href.startsWith("http")
    ? <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a>
    : <Link href={href} className={className}>{children}</Link>;
}

function SpecimenPhotoTestCard({ test, index }: { test: (typeof specimenPhotoTests)[number]; index: number }) {
  return (
    <article className="v2-species-card v2-photo-test-card">
      <SpecimenLeaf image={test.image} alt={`${test.label}; species identity not assigned`} number={`TEST-${String(index + 1).padStart(2, "0")}`} size="card" />
      <span className="v2-species-status">Temporary visual test</span>
      <strong>{test.label}</strong>
      <em>{test.note}</em>
      <small>Owner-supplied photograph</small>
    </article>
  );
}

export function MarketingSite() {
  return (
    <div className="v2-site">
      <a className="skip-link" href="#platform-main">Skip to content</a>
      <Header />
      <main id="platform-main">
        <section className="v2-hero">
          <div className="v2-container v2-hero-grid">
            <div className="v2-hero-copy">
              <p className="v2-label">Independent Canadian Studio</p>
              <h1>Tools, games, and resources for the isopod hobby.</h1>
              <p>Podscape Labs is an independent Canadian studio building projects, practical tools, and useful resources for isopod keepers.</p>
              <div className="v2-actions">
                <Link className="v2-button v2-button-primary" href="/explore">Explore Podscape <span aria-hidden="true">→</span></Link>
                <Link className="v2-button v2-button-outline" href="/ledger">Open Leaf Ledger <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <div className="v2-hero-specimen">
              <SpecimenLeaf image={specimenPhotoTests[0].image} alt="Temporary hero specimen photograph; species identity not assigned" size="hero" number="FIELD NOTE 001" />
              <aside className="v2-field-note"><span>Field Note</span><strong>No. 001</strong><LeafIcon /><small>Temporary photo test</small></aside>
            </div>
          </div>
        </section>

        <section className="v2-home-section v2-explore-section" aria-labelledby="explore-podscape-title">
          <div className="v2-container">
            <div className="v2-section-line"><h2 id="explore-podscape-title">Explore Podscape</h2><Link href="/explore">View everything <span aria-hidden="true">→</span></Link></div>
            <div className="v2-area-grid">
              {platformAreas.map((area) => <SmartLink className={`v2-area-card tone-${area.key}`} href={area.href} key={area.key}><span className="v2-area-icon">{areaIcons[area.key]}</span><strong>{area.title}</strong><p>{area.description}</p><span className="v2-card-arrow" aria-hidden="true">→</span></SmartLink>)}
            </div>
          </div>
        </section>

        <section className="v2-home-section" aria-labelledby="lab-bench-title">
          <div className="v2-container">
            <div className="v2-section-line"><h2 id="lab-bench-title">The Lab Bench</h2><Link href="/from-the-lab">View all projects <span aria-hidden="true">→</span></Link></div>
            <div className="v2-bench-grid">
              {labBench.map((item) => <article className={`v2-status-card tone-${item.tone}`} key={item.area}><span>{item.status}</span><strong>{item.area}</strong><p>{item.detail}</p></article>)}
              <Link className="v2-process-card" href="/from-the-lab"><LeafIcon /><span>Curious about our process?</span><strong>From the Lab →</strong></Link>
            </div>
          </div>
        </section>

        <section className="v2-home-section" aria-labelledby="whats-new-title">
          <div className="v2-container">
            <div className="v2-section-line"><h2 id="whats-new-title">What&apos;s New</h2><Link href="/from-the-lab">View all updates <span aria-hidden="true">→</span></Link></div>
            <div className="v2-update-grid">
              {updates.map((update) => <SmartLink className="v2-update-card" href={update.href} key={update.title}><span>{update.category}</span><strong>{update.title}</strong><p>{update.description}</p><small>{update.date}</small></SmartLink>)}
            </div>
          </div>
        </section>

        <section className="v2-home-section" aria-labelledby="latest-ledger-title">
          <div className="v2-container">
            <div className="v2-section-line"><h2 id="latest-ledger-title">Latest in the Leaf Ledger</h2><Link href="/ledger">View all species <span aria-hidden="true">→</span></Link></div>
            <div className="v2-species-rail">{specimenPhotoTests.map((test, index) => <SpecimenPhotoTestCard test={test} index={index} key={test.id} />)}</div>
          </div>
        </section>

        <section className="v2-feature-section">
          <div className="v2-container v2-feature-grid">
            <article className="v2-podbound-feature">
              <div className="v2-feature-copy">
                <p className="v2-kicker">PodBound · Field Archives</p>
                <Image src="/assets/logos/podbound-logo.png" alt="PodBound" width={1800} height={791} />
                <h2>The game of forecast, choice, and colony.</h2>
                <p>PodBound is a tabletop strategy game built around managing an isopod colony through changing conditions.</p>
                <a className="v2-button v2-button-light" href="https://www.podbound.net" target="_blank" rel="noreferrer">Visit PodBound <ArrowUpRightIcon /></a>
              </div>
              <PodboundCardRotator />
            </article>
            <article className="v2-creative-feature" id="creative-network">
              <div><p className="v2-kicker">Creative Network · Phase 2</p><h2>Made by people who make things.</h2><p>A future discovery space for independent artists, designers, makers, and creators working with the hobby.</p><Link className="v2-button v2-button-outline" href="/explore#creative-network">Explore the plan <span aria-hidden="true">→</span></Link></div>
              <div className="v2-creative-mark" aria-hidden="true"><CreativeIcon /><span>Independent<br />creative work</span></div>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
