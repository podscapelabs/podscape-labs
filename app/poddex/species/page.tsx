import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHeader } from "@/components/PageHeader";
import { PodDexExplorer } from "@/components/PodDexExplorer";
import { visibleSpecies } from "@/content/species";

export const metadata: Metadata = { title: "Species archive" };

export default function SpeciesArchivePage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="species-archive-page">
        <PageHeader
          eyebrow="PodDex directory"
          title="Species archive"
          body="Search published and upcoming PodDex records by name, number, or genus. The archive will continue to grow in release waves."
          marker={`${visibleSpecies.length} records`}
        />
        <div className="shell-wide"><PodDexExplorer records={visibleSpecies} /></div>
      </main>
      <Footer />
    </>
  );
}
