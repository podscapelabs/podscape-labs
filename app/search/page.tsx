import type { Metadata } from "next";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { UniversalSearch } from "@/components/UniversalSearch";
import { isGuideActive } from "@/data/guides";
import { isSpeciesRecordActive } from "@/data/species";
import { isProductActive } from "@/data/products";
import { isLabRecordActive } from "@/data/lab";
import { getGuideRecords } from "@/lib/guide-store";
import { getSpeciesRecords } from "@/lib/species-store";
import { getProductRecords } from "@/lib/product-store";
import { getLabRecords } from "@/lib/lab-store";

export const metadata: Metadata = { title: "Search | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SearchPage() { const [speciesRecords, guideRecords, productRecords, labRecords] = await Promise.all([getSpeciesRecords(), getGuideRecords(), getProductRecords(), getLabRecords()]); return <PlatformShell><PlatformPageHeader eyebrow="Universal search foundation" title="Search Podscape" intro="One index for species, guides, products, projects, and studio updates." index="IDX / 001" /><section className="v2-page-section"><div className="v2-container"><UniversalSearch speciesRecords={speciesRecords.filter(isSpeciesRecordActive)} guideRecords={guideRecords.filter(isGuideActive)} productRecords={productRecords.filter(isProductActive)} labRecords={labRecords.filter(isLabRecordActive)} /></div></section></PlatformShell>; }
