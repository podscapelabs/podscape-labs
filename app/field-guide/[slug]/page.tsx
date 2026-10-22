import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/PlatformShell";
import { getGuideRecord } from "@/lib/guide-store";
import { getSpeciesRecords } from "@/lib/species-store";
import { speciesDisplayName, speciesScientificName } from "@/data/species";
import GuideReader from "./GuideReader";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = await getGuideRecord((await params).slug);
  return { title: guide ? `${guide.title} | Podscape Field Guide` : "Field Guide article", description: guide?.summary, robots: { index: false, follow: false } };
}
export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const guide = await getGuideRecord((await params).slug);
  if (!guide) notFound();
  const records = await getSpeciesRecords();
  const related = guide.relatedSpeciesSlugs.flatMap(slug => {
    const record = records.find(candidate => candidate.slug === slug && !candidate.archivedAt);
    return record ? [{ slug: record.slug, name: speciesDisplayName(record), scientific: speciesScientificName(record) }] : [];
  });
  return <PlatformShell><GuideReader title={guide.title} summary={guide.summary || ""} category={guide.category} date={new Date(guide.updatedAt).toLocaleDateString("en-CA", { dateStyle: "medium" })} sections={guide.sections.map(section => ({id:section.id,heading:section.heading,body:section.body}))} caution={guide.caution} related={related}/></PlatformShell>;
}
