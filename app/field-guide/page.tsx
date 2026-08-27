import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { guideCategories, guideDrafts } from "@/data/guides";

export const metadata: Metadata = { title: "Field Guide | Podscape Labs", robots: { index: false, follow: false } };

export default function FieldGuidePage() {
  return <PlatformShell><PlatformPageHeader eyebrow="Practical husbandry resources" title="Field Guide" intro="A modern field manual for understanding care topics—not a duplicate of the species catalogue." index="FG / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-guide-layout"><aside><p className="v2-kicker">Browse topics</p>{guideCategories.map((category, index) => <span key={category}>{String(index + 1).padStart(2, "0")} · {category}</span>)}</aside><div><div className="v2-guide-intro"><p className="v2-kicker">Editorial foundation</p><h2>Care information will be structured for clarity.</h2><p>Approved guides will combine readable articles, concise metadata, related species, and contextual cautions where needed.</p></div><div className="v2-guide-drafts">{guideDrafts.map((guide) => <Link href={`/field-guide/${guide.slug}`} key={guide.slug}><span>{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary}</p><small>Clearly marked studio draft →</small></Link>)}</div></div></div></div></section></PlatformShell>;
}
