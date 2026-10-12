import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { labRecordDate } from "@/data/lab";
import { getLabRecord } from "@/lib/lab-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const record = await getLabRecord((await params).slug);
  return { title: record ? `${record.title} | From the Lab` : "Studio note | From the Lab", description: record?.summary, robots: { index: false, follow: false } };
}

function RelatedLink({ href, label }: { href: string; label: string }) {
  return href.startsWith("http") ? <a className="v2-button v2-button-outline" href={href} target="_blank" rel="noreferrer">{label} →</a> : <Link className="v2-button v2-button-outline" href={href}>{label} →</Link>;
}

export default async function LabArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const record = await getLabRecord((await params).slug);
  if (!record) notFound();
  return <PlatformShell><article className="v2-article-page v2-lab-article"><div className="v2-container"><Breadcrumbs items={[{ label: "From the Lab", href: "/from-the-lab" }, { label: record.title }]} /><header><p className="v2-label">{record.category} · {record.status === "draft" ? "Studio draft" : "Published note"}</p><h1>{record.title}</h1><p>{record.summary || "This studio note is awaiting its summary."}</p><div><span>{record.status === "published" ? `Published · ${labRecordDate(record)}` : `Updated · ${labRecordDate(record)}`}</span><span>{record.sections.length} {record.sections.length === 1 ? "section" : "sections"}</span></div></header><div className="v2-article-layout"><aside><b>In this note</b>{record.sections.map((section, index) => <a href={`#${section.id}`} key={section.id}>{String(index + 1).padStart(2, "0")} · {section.heading || "Untitled section"}</a>)}</aside><div className="v2-article-content">{record.sections.map((section, index) => <section id={section.id} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading || "Section heading pending"}</h2>{section.body.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>)}</section>)}{!record.sections.length ? <section><span>01</span><h2>Article content has not been written yet.</h2><p>This studio draft is ready for its first section.</p></section> : null}{record.relatedHref && record.relatedLabel ? <aside className="v2-lab-related"><span>Continue exploring</span><RelatedLink href={record.relatedHref} label={record.relatedLabel} /></aside> : null}</div></div></div></article></PlatformShell>;
}
