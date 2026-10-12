import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { getGuideRecord } from "@/lib/guide-store";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = await getGuideRecord((await params).slug);
  return { title: guide ? `${guide.title} | Podscape Field Guide` : "Field Guide article", description: guide?.summary, robots: { index: false, follow: false } };
}

export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const guide = await getGuideRecord((await params).slug);
  if (!guide) notFound();
  const speciesRecords = await getSpeciesRecords();
  const relatedSpecies = guide.relatedSpeciesSlugs.flatMap((slug) => {
    const record = speciesRecords.find((candidate) => candidate.slug === slug && !candidate.archivedAt);
    return record ? [record] : [];
  });

  return <PlatformShell><article className="v2-article-page"><div className="v2-container"><Breadcrumbs items={[{ label: "Field Guide", href: "/field-guide" }, { label: guide.title }]} /><header><p className="v2-label">{guide.category} · {guide.status === "published" ? "Published guide" : "Studio draft"}</p><h1>{guide.title}</h1><p>{guide.summary || "This guide summary has not been written yet."}</p><div><span>Updated · {new Date(guide.updatedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</span><span>{guide.sections.length} {guide.sections.length === 1 ? "section" : "sections"}</span></div></header><div className="v2-article-layout"><aside><b>In this guide</b>{guide.sections.map((section, index) => <a href={`#${section.id}`} key={section.id}>{String(index + 1).padStart(2, "0")} · {section.heading || "Untitled section"}</a>)}{relatedSpecies.length ? <a href="#related-species">Related species</a> : null}</aside><div className="v2-article-content">{guide.caution ? <aside className="v2-guide-caution"><span>Field note</span><p>{guide.caution}</p></aside> : null}{guide.sections.map((section, index) => <section id={section.id} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading || "Section heading pending"}</h2>{section.body.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>)}</section>)}{!guide.sections.length ? <section><span>01</span><h2>Article content has not been written yet.</h2><p>This studio draft is ready for its first reviewed section.</p></section> : null}{relatedSpecies.length ? <section id="related-species" className="v2-related-guides"><span>Related Leaf Ledger records</span><h2>Species connected to this guide.</h2><div>{relatedSpecies.map((record) => <Link href={`/ledger/${record.slug}`} key={record.id}><strong>{speciesDisplayName(record)}</strong><em>{speciesScientificName(record)}</em><small>Open Ledger record →</small></Link>)}</div></section> : null}</div></div></div></article></PlatformShell>;
}
