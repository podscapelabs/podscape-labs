import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FieldIcon, IsopodStudy } from "@/components/FieldArtwork";
import { PodboundCardRotator } from "@/components/PodboundCardRotator";
import { homeContent, siteContent } from "@/content/site";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="field-home shell">
        <section className="discovery-hero" aria-labelledby="hero-title">
          <div className="discovery-copy">
            <p className="eyebrow">{siteContent.brand.descriptor} · Ontario, Canada</p>
            <h1 id="hero-title">Explore the<br />world of <em>isopods.</em></h1>
            <p className="discovery-tagline">Collect. Learn. Create. Connect.</p>
            <p className="discovery-intro">A little world with a lot to discover. Original projects, curious ideas, and a growing home for the isopod hobby.</p>
            <div className="discovery-actions">
              <a className="button button-primary" href="#explore">Start exploring <span aria-hidden="true">→</span></a>
              <a className="button button-outline" href="#species">Meet the species</a>
            </div>
          </div>
          <figure className="discovery-art">
            <span className="field-coordinate">FIELD NOTES / 001</span>
            <IsopodStudy variant="cow" />
            <figcaption><span>Small creatures. Big world.</span><strong>Porcellio laevis</strong><span>“Dairy Cow” · Illustrated study</span></figcaption>
          </figure>
        </section>
        <section className="destination-section" id="explore" aria-labelledby="explore-title">
          <div className="panel-heading"><h2 id="explore-title">Explore PodScape</h2><span className="micro-label">Your field guide to the lab</span></div>
          <div className="destination-grid">
            {homeContent.destinations.map((item) => (
              <a className="destination" key={item.name} href={item.href}>
                <span className="destination-icon"><FieldIcon name={item.icon} /></span>
                <strong>{item.name}</strong><span>{item.description}</span><small>{item.status}</small>
              </a>
            ))}
          </div>
        </section>
        <div className="discovery-grid">
          <section className="field-panel species-panel" id="species" aria-labelledby="species-title">
            <div className="panel-heading"><div><p className="eyebrow">A closer look</p><h2 id="species-title">Meet the species</h2></div><span className="micro-label">Field studies</span></div>
            <p className="panel-intro">Small details. Remarkable diversity.</p>
            <div className="species-grid">
              {homeContent.species.map((species) => (
                <figure className="species-study" key={species.name}>
                  <div className="specimen-art"><IsopodStudy variant={species.variant} /></div>
                  <figcaption><h3>{species.name}</h3><p><i>{species.scientific}</i></p></figcaption>
                </figure>
              ))}
            </div>
            <p className="panel-footnote">Illustrated previews · The Leaf Ledger species library is in planning.</p>
          </section>
          <section className="field-panel featured-project" id="projects" aria-labelledby="project-title">
            <div className="panel-heading"><p className="eyebrow">Featured project</p><span className="project-dot">In playtesting</span></div>
            <h2 id="project-title">PodBound<span>™</span></h2>
            <p className="feature-tagline">{siteContent.podbound.tagline}</p>
            <div className="feature-card-art"><PodboundCardRotator /></div>
            <p>A forecast-based tabletop strategy game. Choose your species and guide a colony through a changing world.</p>
            <a className="button" href={siteContent.podbound.url}>Explore PodBound <span aria-hidden="true">↗</span></a>
          </section>
          <section className="field-panel studio-panel" id="about" aria-labelledby="about-title">
            <p className="eyebrow">Behind the leaves</p>
            <div className="studio-mark" aria-hidden="true"><FieldIcon name="leaf" /></div>
            <h2 id="about-title">Small by design.<br />Curious by nature.</h2>
            <p>{siteContent.about.body}</p>
            <a className="text-link" href="mailto:podscapelabs@gmail.com">Say hello to the lab <span aria-hidden="true">↗</span></a>
            <span className="micro-label">Ontario, Canada</span>
          </section>
          <section className="field-panel growing-panel" id="growing" aria-labelledby="growing-title">
            <div className="panel-heading"><div><p className="eyebrow">Taking root</p><h2 id="growing-title">A growing little world</h2></div><span className="micro-label">In planning</span></div>
            <p className="panel-intro">Ideas for the next chapter of PodScape. These destinations are not yet available.</p>
            <div className="planned-grid">
              {homeContent.planned.map((item) => (
                <details className="planned-destination" id={item.id} key={item.id}>
                  <summary><FieldIcon name={item.icon} /><span>{item.name}<small>{item.description}</small></span><span className="details-plus" aria-hidden="true">+</span></summary>
                  <p>{item.detail}</p>
                </details>
              ))}
            </div>
          </section>
          <section className="field-panel home-lab-panel" id="lab" aria-labelledby="lab-title">
            <div className="panel-heading"><div><p className="eyebrow">From the Lab</p><h2 id="lab-title">On the workbench</h2></div><span aria-hidden="true">↗</span></div>
            <div className="lab-note-list">
              {siteContent.lab.notes.map((note, index) => (
                <article key={note.title}>
                  <span className="note-number" aria-hidden="true">0{index + 1}</span>
                  <div><p className="micro-label">{note.date}</p><h3>{note.title}</h3><p>{note.summary}</p></div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <div className="home-signoff"><FieldIcon name="leaf" /><p>For the small things worth exploring.</p><span>Podscape Labs™</span></div>
      </main>
      <Footer />
      <nav className="app-dock" aria-label="Quick navigation">
        <a href="#main"><FieldIcon name="home" /><span>Home</span></a>
        <a href="#explore"><FieldIcon name="leaf" /><span>Explore</span></a>
        <a className="dock-feature" href={siteContent.podbound.url}><FieldIcon name="cards" /><span>PodBound</span></a>
        <a href="#lab"><FieldIcon name="book" /><span>The Lab</span></a>
        <a href="#growing"><FieldIcon name="grid" /><span>More</span></a>
      </nav>
    </>
  );
}
