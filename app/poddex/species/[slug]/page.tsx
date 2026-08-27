import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  formatPodDexNumber,
  formatReleaseDate,
  getSpeciesBySlug,
  visibleSpecies,
} from "@/content/species";

type SpeciesPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return visibleSpecies.map((record) => ({ slug: record.slug }));
}

export async function generateMetadata({ params }: SpeciesPageProps): Promise<Metadata> {
  const record = getSpeciesBySlug((await params).slug);
  return record ? { title: record.scientificName, description: record.summary } : {};
}

export default async function SpeciesDetailPage({ params }: SpeciesPageProps) {
  const record = getSpeciesBySlug((await params).slug);
  if (!record || record.status === "draft") notFound();

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="species-detail-page">
        <div className="species-breadcrumb shell-wide">
          <Link href="/poddex">PodDex</Link><span>/</span>
          <Link href="/poddex/species">Species</Link><span>/</span>
          <span>{formatPodDexNumber(record.poddexNumber)}</span>
        </div>

        <article className="species-profile shell-wide">
          <div className="species-profile-leaf" data-genus={record.genus} aria-hidden="true">
            <span className="species-profile-vein" />
            <b>{record.genus.slice(0, 1)}</b>
            <small>PodDex specimen</small>
          </div>
          <div className="species-profile-copy">
            <div className="species-profile-topline">
              <span>{formatPodDexNumber(record.poddexNumber)}</span>
              <span className={`species-profile-status status-${record.status}`}>
                {record.status === "scheduled" ? "Coming soon" : "Published"}
              </span>
            </div>
            <p className="eyebrow">{record.commonName || "Species record"}</p>
            <h1><i>{record.scientificName}</i></h1>
            <p className="species-profile-summary">{record.summary}</p>
            <dl className="species-facts">
              <div><dt>Genus</dt><dd><i>{record.genus}</i></dd></div>
              <div><dt>Origin</dt><dd>{record.origin || "Record in preparation"}</dd></div>
              <div><dt>Release wave</dt><dd>{record.releaseWave}</dd></div>
              <div><dt>{record.status === "scheduled" ? "Scheduled" : "Catalogued"}</dt><dd>{formatReleaseDate(record.releaseDate)}</dd></div>
            </dl>
          </div>
        </article>

        <section className="species-next shell-wide">
          <div>
            <p className="eyebrow">A focused first record</p>
            <h2>Designed to grow with the archive.</h2>
          </div>
          <p>This starter profile keeps the field record clear and readable. Future guide, vendor, PodBound card, and collection relationships can be added without rebuilding the species foundation.</p>
          <Link className="button button-primary" href="/poddex/species">Return to species archive</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
