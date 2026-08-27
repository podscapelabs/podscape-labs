import Link from "next/link";
import { siteContent } from "@/content/site";
import { ArrowUpRightIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell-wide footer-topline">
        <p className="footer-brand">Podscape Labs™</p>
        <p>Original tools, games, and resources for the isopod hobby.</p>
      </div>
      <div className="shell-wide footer-navigation">
        <div>
          <p className="footer-label">Explore</p>
          <Link href="/poddex">PodDex</Link>
          <a href={siteContent.podbound.url} target="_blank" rel="noreferrer">PodBound<ArrowUpRightIcon /></a>
          <Link href="/admin/preview#field-guide">Field Guide</Link>
        </div>
        <div>
          <p className="footer-label">Studio</p>
          <Link href="/admin/preview#lab">From the Lab</Link>
          <Link href="/admin/preview#about">About</Link>
        </div>
        <div className="footer-meta">
          <p>{siteContent.brand.location}</p>
          <p>{siteContent.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
