import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/PlatformShell";
import { getGuideRecord } from "@/lib/guide-store";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import styles from "./article.module.css";

function renderBody(body: string, id: string) {
  return body.split(/\n{2,}/).map((block, index) => {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(line => /^[-*•]\s+/.test(line))) return <ul className={styles.bullets} key={`${id}-${index}`}>{lines.map((line, i) => <li key={i}>{line.replace(/^[-*•]\s+/, "")}</li>)}</ul>;
    if (lines.length > 1 && lines.every(line => line.includes(" | "))) return <div className={styles.reference} key={`${id}-${index}`}>{lines.map((line, i) => { const [heading, ...rest] = line.split(" | "); return <div key={i}><strong>{heading}</strong>{rest.join(" · ")}</div>; })}</div>;
    return <p key={`${id}-${index}`}>{block}</p>;
  });
}


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

  return <PlatformShell><article className={styles.page}><div className={styles.wrap}>
    <div className={styles.crumb}><Link href="/field-guide">← Field Guide</Link></div>
    <header className={styles.hero}><div className={styles.eyebrow}>{guide.category} · {guide.status === "published" ? "Published guide" : "Studio draft"}</div><h1>{guide.title}</h1><p className={styles.summary}>{guide.summary || "This guide summary has not been written yet."}</p><div className={styles.meta}><span>Updated · {new Date(guide.updatedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}</span><span>{guide.sections.length} sections</span></div></header>
    <div className={styles.layout}><details className={styles.toc}><summary>In this guide · {guide.sections.length} sections</summary><nav aria-label="Guide contents">{guide.sections.map((section, index) => <a href={`#${section.id}`} key={section.id}>{String(index + 1).padStart(2, "0")} · {section.heading || "Untitled section"}</a>)}{relatedSpecies.length ? <a href="#related-species">Related species</a> : null}</nav></details>
    <div className={styles.content}>{guide.caution ? <aside className={styles.note}><strong>Field note</strong><p>{guide.caution}</p></aside> : null}
    {guide.sections.map((section, index) => <section className={styles.section} id={section.id} key={section.id}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading || "Section heading pending"}</h2>{renderBody(section.body, section.id)}</section>)}
    {!guide.sections.length ? <section className={styles.section}><h2>Article content has not been written yet.</h2></section> : null}
    {relatedSpecies.length ? <section id="related-species" className={styles.section}><h2>Related species</h2><div className={styles.related}>{relatedSpecies.map(record => <Link href={`/ledger/${record.slug}`} key={record.id}><strong>{speciesDisplayName(record)}</strong><em>{speciesScientificName(record)}</em></Link>)}</div></section> : null}
    <Link className={styles.back} href="/field-guide">← Back to all guides</Link></div></div></div></article></PlatformShell>;
}
