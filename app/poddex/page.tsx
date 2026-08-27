import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LeafSpeciesCard } from "@/components/LeafSpeciesCard";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { formatReleaseDate, publishedSpecies, scheduledSpecies } from "@/content/species";

export default function PodDexPage() {
  const latest = [...publishedSpecies].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)).slice(0, 3);
  const next = [...scheduledSpecies].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="poddex-page">
        <PageHeader
          eyebrow="Podscape field archive"
          title="PodDex"
          body="A growing field index and collection-minded species archive for the isopod hobby. Built to make discovery feel clear, visual, and worth returning to."
        />

        <section className="poddex-ledger shell-wide" aria-label="PodDex catalogue status">
          <div><strong>{String(publishedSpecies.length).padStart(2, "0")}</strong><span>Published records</span></div>
          <div><strong>{String(scheduledSpecies.length).padStart(2, "0")}</strong><span>Scheduled next</span></div>
          <div><strong>01</strong><span>Active release wave</span></div>
          <Link href="/poddex/species">Browse all species<span aria-hidden="true">→</span></Link>
        </section>

        <section className="poddex-latest shell-wide" aria-labelledby="poddex-latest-title">
          <SectionHeader eyebrow="New this week" title="Latest additions." body="The newest records added to the living PodDex catalogue." />
          <div className="leaf-grid leaf-grid-featured" id="poddex-latest-title">
            {latest.map((record) => <LeafSpeciesCard record={record} key={record.id} />)}
          </div>
        </section>

        {next ? (
          <section className="upcoming-record shell-wide" aria-labelledby="upcoming-title">
            <div className="upcoming-leaf" data-genus={next.genus} aria-hidden="true"><span>Next</span></div>
            <div>
              <p className="eyebrow">Coming soon · {next.releaseWave}</p>
              <h2 id="upcoming-title"><i>{next.scientificName}</i></h2>
              <p>{next.summary}</p>
              <span>Scheduled {formatReleaseDate(next.releaseDate)}</span>
            </div>
          </section>
        ) : null}

        <section className="poddex-principles shell-wide" aria-labelledby="archive-principles-title">
          <p className="eyebrow">Archive principles</p>
          <h2 id="archive-principles-title">Built to expand without becoming overwhelming.</h2>
          <div>
            <article><span>01</span><h3>Clear records</h3><p>Each species begins with a concise identity, origin, and release record.</p></article>
            <article><span>02</span><h3>Considered waves</h3><p>New records arrive in groups that give visitors a reason to return.</p></article>
            <article><span>03</span><h3>Ready to connect</h3><p>The structure can later connect guides, vendors, cards, and collections.</p></article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
