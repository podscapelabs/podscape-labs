import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { guideDrafts } from "@/data/guides";

export const metadata: Metadata = { title: "Field Guide Article Template | Podscape Labs", robots: { index: false, follow: false } };
export function generateStaticParams() { return guideDrafts.map(({ slug }) => ({ slug })); }

export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideDrafts.find((item) => item.slug === slug); if (!guide) notFound();
  return <PlatformShell><article className="v2-article-page"><div className="v2-container"><Breadcrumbs items={[{ label: "Field Guide", href: "/field-guide" }, { label: guide.title }]} /><header><p className="v2-label">{guide.category} · Draft</p><h1>{guide.title}</h1><p>{guide.summary}</p><div><span>Updated · Not published</span><span>Studio-authored content pending</span></div></header><div className="v2-article-layout"><aside><b>In this guide</b><span>Overview</span><span>Core topic</span><span>Keeper notes</span><span>Related resources</span></aside><div className="v2-article-placeholder"><section><span>01</span><h2>Article content has not been written yet.</h2><p>This template demonstrates the intended reading width, hierarchy, metadata column, and related-resource structure without fabricating husbandry advice.</p></section><section><span>02</span><h2>Contextual care notes belong here.</h2><p>Future material will be reviewed before publication and connected to relevant Leaf Ledger records.</p></section></div></div></div></article></PlatformShell>;
}
