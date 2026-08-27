import type { Metadata } from "next";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { UniversalSearch } from "@/components/UniversalSearch";

export const metadata: Metadata = { title: "Search | Podscape Labs", robots: { index: false, follow: false } };
export default function SearchPage() { return <PlatformShell><PlatformPageHeader eyebrow="Universal search foundation" title="Search Podscape" intro="One index for species, guides, projects, and studio updates." index="IDX / 001" /><section className="v2-page-section"><div className="v2-container"><UniversalSearch /></div></section></PlatformShell>; }
