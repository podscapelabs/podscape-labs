import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { labBench, updates } from "@/data/platform";

export const metadata: Metadata = { title: "From the Lab | Podscape Labs", robots: { index: false, follow: false } };

export default function LabPage() {
  return <PlatformShell><PlatformPageHeader eyebrow="Studio notebook" title="From the Lab" intro="See what we're testing, building, and learning across the Podscape ecosystem." index="LAB / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-lab-page-grid"><div><p className="v2-kicker">On the bench</p>{labBench.map((item) => <article key={item.area}><span>{item.status}</span><h2>{item.area}</h2><p>{item.detail}</p></article>)}</div><div><p className="v2-kicker">Studio updates</p>{updates.map((update) => <Link href={update.href} key={update.title}><span>{update.category} · {update.date}</span><h2>{update.title}</h2><p>{update.description}</p><small>Open update →</small></Link>)}</div></div></div></section></PlatformShell>;
}
