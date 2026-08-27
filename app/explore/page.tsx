import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { platformAreas } from "@/data/platform";

export const metadata: Metadata = { title: "Explore Podscape", robots: { index: false, follow: false } };

const supporting = [
  { title: "From the Lab", copy: "Studio notes, project development, and work in progress.", href: "/from-the-lab", phase: "Phase 1" },
  { title: "Shop", copy: "A future home for Podscape products and physical resources.", href: "#shop", phase: "Planned" },
  { title: "About", copy: "The independent Ontario studio behind Podscape.", href: "#about", phase: "Studio" },
];

export default function ExplorePage() {
  return <PlatformShell><PlatformPageHeader eyebrow="A map of the ecosystem" title="Explore Podscape" intro="Tools, projects, field resources, and discovery systems—built to work together." index="MAP / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-explore-map">{platformAreas.map((area, index) => <article id={area.key === "creative" ? "creative-network" : area.key === "directory" ? "vendor-directory" : undefined} key={area.key}><span>{String(index + 1).padStart(2, "0")}</span><h2>{area.title}</h2><p>{area.description}</p>{area.key === "creative" || area.key === "directory" ? <small>Planned for Phase 2</small> : area.href.startsWith("http") ? <a href={area.href} target="_blank" rel="noreferrer">Visit project →</a> : <Link href={area.href}>Open area →</Link>}</article>)}</div><div className="v2-support-grid">{supporting.map((item) => <article id={item.title.toLowerCase()} key={item.title}><span>{item.phase}</span><h2>{item.title}</h2><p>{item.copy}</p><Link href={item.href}>Explore →</Link></article>)}</div><section className="v2-about-panel" id="about"><p className="v2-kicker">About Podscape Labs</p><h2>Independent, useful, and built with intention.</h2><p>Podscape Labs is an independent studio in Ontario, Canada creating tools, games, projects, and resources for the isopod hobby.</p></section></div></section></PlatformShell>;
}
