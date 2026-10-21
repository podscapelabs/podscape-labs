import { siteContent } from "@/content/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <p className="footer-brand">Podscape Labs™</p>
        <div className="footer-socials" aria-label="Studio links">
          <a href="mailto:podscapelabs@gmail.com">Contact the lab ↗</a>
          <a href={siteContent.podbound.url}>PodBound ↗</a>
        </div>
        <div className="footer-meta">
          <p>{siteContent.brand.location}</p>
          <p>{siteContent.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
