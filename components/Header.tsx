import Image from "next/image";
import Link from "next/link";
import { siteContent } from "@/content/site";
import { ArrowUpRightIcon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner shell-wide">
        <Link className="brand" href="/admin/preview" aria-label="Podscape Labs working site home">
          <Image src="/assets/logos/podscape-wordmark.svg" alt="Podscape Labs" width={232} height={38} priority />
        </Link>
        <nav className="desktop-navigation" aria-label="Primary navigation">
          <ul className="nav-links">
            {siteContent.navigation.map((item) => (
              <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a className="podbound-link" href={siteContent.podbound.url} target="_blank" rel="noreferrer">
            PodBound<ArrowUpRightIcon />
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open primary navigation">Menu</summary>
            <nav aria-label="Mobile primary navigation">
              <ul className="mobile-nav-links">
                {siteContent.navigation.map((item) => (
                  <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
                ))}
                <li><a href={siteContent.podbound.url} target="_blank" rel="noreferrer">PodBound<ArrowUpRightIcon /></a></li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
