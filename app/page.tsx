import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowUpRightIcon } from "@/components/Icons";
import { siteContent } from "@/content/site";

export default function Home() {
  const { hero, podbound, lab, about } = siteContent;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid shell">
            <div className="hero-copy">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 id="hero-title">{hero.title}</h1>
              <p className="hero-intro">{hero.body}</p>
              <div className="hero-actions">
                <a className="button button-primary" href={hero.primaryAction.href}>
                  {hero.primaryAction.label}
                </a>
                <a className="text-link" href={hero.secondaryAction.href}>
                  {hero.secondaryAction.label}<span aria-hidden="true"> ↓</span>
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <Image
                src="/assets/photos/hero-photo.svg"
                alt=""
                fill
                priority
                sizes="(max-width: 800px) 100vw, 46vw"
              />
              <span className="figure-index" aria-hidden="true">PL / 01</span>
            </div>
          </div>
        </section>

        <section className="project-section" id="projects" aria-labelledby="project-title">
          <div className="shell">
            <div className="section-marker">
              <span>01</span><span>Featured project</span>
            </div>
            <div className="project-grid">
              <div className="project-logo-stage">
                <Image
                  className="project-logo"
                  src="/assets/logos/podbound-logo.png"
                  alt="PodBound Field Archives"
                  width={1800}
                  height={791}
                />
              </div>
              <div className="project-copy">
                <p className="status"><span aria-hidden="true" />{podbound.status}</p>
                <div className="project-identity">
                  <h2 className="project-name" id="project-title">{podbound.name}</h2>
                  <p className="project-tagline">{podbound.tagline}</p>
                </div>
                <p className="project-description">{podbound.description}</p>
                <a className="button button-outline" href={podbound.url} target="_blank" rel="noreferrer">
                  {podbound.linkLabel}<ArrowUpRightIcon />
                </a>
              </div>
              <div className="podbound-card-slot">
                <Image
                  src="/assets/podbound/podbound-card.png"
                  alt="PodBound Rotting Wood card, value three"
                  width={420}
                  height={590}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="lab-section" id="lab" aria-labelledby="lab-title">
          <div className="shell">
            <div className="section-marker">
              <span>02</span><span>{lab.eyebrow}</span>
            </div>
            <div className="section-heading-grid">
              <h2 id="lab-title">{lab.title}</h2>
              <p>{lab.intro}</p>
            </div>
            <div className="notes" role="list">
              {lab.notes.map((note, index) => (
                <article className="note" key={note.title} role="listitem">
                  <div className="note-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <time>{note.date}</time>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="shell">
            <div className="section-marker section-marker-light">
              <span>03</span><span>{about.eyebrow}</span>
            </div>
            <div className="about-grid">
              <h2 id="about-title">{about.title}</h2>
              <div>
                <p>{about.body}</p>
                <p className="location">{siteContent.brand.location}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
