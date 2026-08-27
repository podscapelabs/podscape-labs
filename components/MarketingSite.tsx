import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowUpRightIcon } from "@/components/Icons";
import { LeafSpeciesCard } from "@/components/LeafSpeciesCard";
import { PlatformCard } from "@/components/PlatformCard";
import { PodboundCardRotator } from "@/components/PodboundCardRotator";
import { SectionHeader } from "@/components/SectionHeader";
import { publishedSpecies, scheduledSpecies } from "@/content/species";
import { siteContent } from "@/content/site";

export function MarketingSite() {
  const { hero, destinations, podbound, fieldGuide, lab, about } = siteContent;
  const latestSpecies = [...publishedSpecies].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).slice(0, 3);
  const nextSpecies = [...scheduledSpecies].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <section className="platform-hero" aria-labelledby="hero-title">
          <div className="platform-hero-grid shell-wide">
            <div className="platform-hero-copy">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 id="hero-title">{hero.title}</h1>
              <p className="hero-intro">{hero.body}</p>
              <div className="hero-actions">
                <Link className="button button-primary" href={hero.primaryAction.href}>
                  {hero.primaryAction.label}<span aria-hidden="true">→</span>
                </Link>
                <a className="button button-quiet" href={hero.secondaryAction.href} target="_blank" rel="noreferrer">
                  {hero.secondaryAction.label}<ArrowUpRightIcon />
                </a>
              </div>
              <div className="hero-index-line" aria-label="Platform destinations">
                <span>Field archive</span><span>Original games</span><span>Keeper references</span>
              </div>
            </div>

            <div className="hero-archive" aria-label="Podscape platform preview">
              <div className="hero-archive-label"><span>Archive plate</span><span>PL / 001</span></div>
              <div className="hero-leaf hero-leaf-main"><span>PodDex</span><b>Growing field index</b></div>
              <div className="hero-leaf hero-leaf-small"><span>Field Guide</span><b>Useful references</b></div>
              <div className="hero-seal"><b>4</b><span>destinations</span></div>
              <div className="hero-grid-lines" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="explore-section" id="explore" aria-labelledby="explore-title">
          <div className="shell-wide">
            <SectionHeader
              eyebrow="Explore Podscape"
              title="A platform with places to go."
              body="Move between field records, original projects, useful references, and the studio notebook."
            />
            <div className="platform-grid" id="explore-title">
              {destinations.map((destination) => <PlatformCard destination={destination} key={destination.key} />)}
            </div>
          </div>
        </section>

        <section className="latest-section" aria-labelledby="latest-title">
          <div className="shell-wide">
            <div className="latest-heading">
              <SectionHeader
                eyebrow="Latest from PodDex"
                title="Recently catalogued."
                body="A growing species archive released in considered waves, with new field records added over time."
              />
              <div className="latest-stat" aria-label={`${publishedSpecies.length} published species records`}>
                <strong>{String(publishedSpecies.length).padStart(2, "0")}</strong>
                <span>Published records</span>
              </div>
            </div>
            <div className="latest-leaf-grid">
              {latestSpecies.map((record) => <LeafSpeciesCard record={record} compact key={record.id} />)}
            </div>
            <div className="release-strip">
              <div>
                <span className="release-pulse" aria-hidden="true" />
                <p><b>Coming soon</b>{nextSpecies?.scientificName || "Next catalogue record"}</p>
              </div>
              <Link href="/poddex/species">View the species archive<span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="podbound-feature" aria-labelledby="podbound-title">
          <div className="shell-wide podbound-feature-grid">
            <div className="podbound-feature-copy">
              <p className="eyebrow">Featured original project</p>
              <p className="status"><span aria-hidden="true" />{podbound.status}</p>
              <Image
                className="project-logo"
                src="/assets/logos/podbound-logo.png"
                alt="PodBound"
                width={1800}
                height={791}
              />
              <h2 id="podbound-title">{podbound.tagline}</h2>
              <p>{podbound.description}</p>
              <a className="button button-copper" href={podbound.url} target="_blank" rel="noreferrer">
                {podbound.linkLabel}<ArrowUpRightIcon />
              </a>
            </div>
            <div className="podbound-card-stage">
              <div className="podbound-stage-label"><span>Playable prototype</span><span>V42</span></div>
              <PodboundCardRotator />
            </div>
          </div>
        </section>

        <section className="field-guide-section" id="field-guide" aria-labelledby="field-guide-title">
          <div className="shell-wide field-guide-grid">
            <div>
              <p className="eyebrow">{fieldGuide.eyebrow}</p>
              <h2 id="field-guide-title">{fieldGuide.title}</h2>
            </div>
            <div className="field-guide-copy">
              <p>{fieldGuide.body}</p>
              <div className="field-guide-topics">
                {fieldGuide.topics.map((topic, index) => (
                  <div key={topic}><span>{String(index + 1).padStart(2, "0")}</span><b>{topic}</b><small>In development</small></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lab-section" id="lab" aria-labelledby="lab-title">
          <div className="shell-wide">
            <SectionHeader eyebrow={lab.eyebrow} title={lab.title} body={lab.intro} />
            <div className="article-grid" id="lab-title">
              {lab.notes.map((note, index) => <ArticleCard note={note} index={index} key={note.title} />)}
            </div>
          </div>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="shell-wide about-grid">
            <div className="about-marker" aria-hidden="true"><span>PL</span><b>Ontario<br />Canada</b></div>
            <div>
              <p className="eyebrow">{about.eyebrow}</p>
              <h2 id="about-title">{about.title}</h2>
              <p>{about.body}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
