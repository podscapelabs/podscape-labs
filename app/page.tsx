import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRightIcon } from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Podscape Labs | Site update in progress",
  description: "Podscape Labs is preparing an updated home for its original projects.",
};

export default function ConstructionPage() {
  return (
    <main className="construction-page">
      <div className="construction-frame">
        <header className="construction-header">
          <Image
            className="construction-wordmark"
            src="/assets/logos/podscape-wordmark.svg"
            alt="Podscape Labs"
            width={232}
            height={38}
            priority
          />
          <ThemeToggle />
        </header>

        <section className="construction-content" aria-labelledby="construction-title">
          <div className="construction-status">
            <span aria-hidden="true" />
            Site update in progress
          </div>
          <p className="eyebrow">Independent Canadian Studio</p>
          <h1 id="construction-title">A new site is taking shape.</h1>
          <p className="construction-intro">
            Podscape Labs is preparing an updated home for its original projects. The studio is still active while this work is underway.
          </p>
          <a
            className="button button-primary construction-action"
            href={siteContent.podbound.url}
            target="_blank"
            rel="noreferrer"
          >
            Visit PodBound<ArrowUpRightIcon />
          </a>
        </section>

        <footer className="construction-footer">
          <span>{siteContent.brand.location}</span>
          <span>{siteContent.footer.copyright}</span>
        </footer>
      </div>
    </main>
  );
}
