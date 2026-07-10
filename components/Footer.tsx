import { siteContent } from "@/content/site";
import { ArrowUpRightIcon } from "./Icons";

export function Footer() {
  const socials = [siteContent.social.facebook, siteContent.social.discord];
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <p className="footer-brand">Podscape Labs™</p>
        <div className="footer-socials" aria-label="Social links">
          {socials.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
              {social.label}<ArrowUpRightIcon />
            </a>
          ))}
        </div>
        <div className="footer-meta">
          <p>{siteContent.brand.location}</p>
          <p>{siteContent.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
