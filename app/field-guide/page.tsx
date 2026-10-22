import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { guideCategories, isGuideActive } from "@/data/guides";
import { getGuideRecords } from "@/lib/guide-store";
import styles from "./field-guide-home.module.css";

export const metadata: Metadata = { title: "Field Guide | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const topicNotes: Record<string, string> = {
  "Getting Started": "Begin your isopod keeping journey.",
  Housing: "Enclosures, hides and setup ideas.",
  Substrate: "Build a healthy foundation.",
  Moisture: "Maintain the right humidity.",
  Ventilation: "Fresh air for thriving colonies.",
  Feeding: "Nutrition and food options.",
  "Colony Management": "Long-term colony care.",
};
const topicMarks = ["❧", "⌂", "◌", "♧", "≋", "✿", "✦"];
const urlFor = (category?: string, query?: string) => {
  const params = new URLSearchParams();
  if (category) params.set("topic", category);
  if (query) params.set("q", query);
  return `/field-guide${params.size ? `?${params.toString()}` : ""}#all-guides`;
};

export default async function FieldGuidePage({ searchParams }: { searchParams: Promise<{ topic?: string; q?: string }> }) {
  const { topic = "", q = "" } = await searchParams;
  const guides = (await getGuideRecords()).filter(isGuideActive).filter((guide) => guide.status === "published");
  const filtered = guides.filter((guide) => (!topic || guide.category === topic) && (!q || `${guide.title} ${guide.summary} ${guide.category}`.toLowerCase().includes(q.toLowerCase())));
  const featured = guides.find((guide) => guide.category === "Getting Started") || guides[0];
  return <PlatformShell><div className={styles.page}><div className={styles.wrap}>
    <header className={styles.hero}><div><small>Practical husbandry resources</small><h1>Field Guide</h1><p>Clear, practical care guides to help you build and maintain healthy isopod colonies.</p></div></header>
    <form action="/field-guide" method="get" className={styles.search}><input name="q" type="search" aria-label="Search guides" placeholder="Search guides..." defaultValue={q} /><button type="submit">Search</button></form>
    <nav className={styles.filters} aria-label="Filter guide topics"><Link className={`${styles.filter} ${!topic ? styles.selected : ""}`} href={urlFor(undefined, q)}>All Topics</Link>{guideCategories.map((category) => <Link className={`${styles.filter} ${topic === category ? styles.selected : ""}`} href={urlFor(category, q)} key={category}>{category}</Link>)}</nav>
    {featured && !topic && !q ? <section className={styles.featured}><small>Featured guide</small><h2>{featured.title}</h2><p>{featured.summary}</p><Link href={`/field-guide/${featured.slug}`}>Read guide →</Link></section> : null}
    <section className={styles.section}><div className={styles.heading}><h2>❧ Browse Topics</h2><Link href={urlFor()}>View all →</Link></div><div className={styles.topics}>{guideCategories.map((category, i) => <Link className={styles.topic} href={urlFor(category)} key={category}><div className={styles.topicArt} aria-hidden="true">{topicMarks[i]}</div><div className={styles.topicBody}><strong>{String(i+1).padStart(2,"0")} · {category}</strong><small>{topicNotes[category]}</small></div></Link>)}</div></section>
    <section className={styles.section} id="all-guides"><div className={styles.heading}><h2>{topic || q ? "Matching guides" : "All Guides"}</h2><Link href={urlFor()}>Clear filters →</Link></div>{filtered.length ? <div className={styles.guides}>{filtered.map((guide, i) => <Link href={`/field-guide/${guide.slug}`} className={styles.guide} key={guide.id}><span className={styles.guideArt} aria-hidden="true">{topicMarks[guideCategories.indexOf(guide.category as typeof guideCategories[number])] || "❧"}</span><div><small>{String(i+1).padStart(2,"0")} · {guide.category}</small><h3>{guide.title}</h3><p>{guide.summary}</p></div><span className={styles.arrow} aria-hidden="true">→</span></Link>)}</div> : <p className={styles.empty}>No published guides match your search yet. Try another topic.</p>}</section>
  </div></div></PlatformShell>;
}
