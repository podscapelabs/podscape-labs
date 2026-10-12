import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { guideCategories, isGuideActive } from "@/data/guides";
import { getGuideRecords } from "@/lib/guide-store";

export const metadata: Metadata = { title: "Field Guide | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FieldGuidePage() {
  const guides = (await getGuideRecords()).filter(isGuideActive);
  return <PlatformShell><PlatformPageHeader eyebrow="Practical husbandry resources" title="Field Guide" intro="A modern field manual for understanding care topics—not a duplicate of the species catalogue." index="FG / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-guide-layout"><aside><p className="v2-kicker">Browse topics</p>{guideCategories.map((category, index) => <span key={category}>{String(index + 1).padStart(2, "0")} · {category}</span>)}</aside><div><div className="v2-guide-intro"><p className="v2-kicker">Editorial foundation</p><h2>Care information, structured for clarity.</h2><p>Studio-reviewed guides combine readable sections, concise metadata, related species, and contextual cautions where needed.</p></div><div className="v2-guide-drafts">{guides.map((guide) => <Link href={`/field-guide/${guide.slug}`} key={guide.id}><span>{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary || "Studio-authored summary pending."}</p><small>{guide.status === "published" ? "Open guide" : "Clearly marked studio draft"} →</small></Link>)}</div>{!guides.length ? <div className="v2-empty-state"><h2>No active guides yet.</h2><p>The editorial desk is ready for the first studio-authored resource.</p></div> : null}</div></div></div></section></PlatformShell>;
}
