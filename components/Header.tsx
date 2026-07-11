import Image from "next/image";
import { siteContent } from "@/content/site";
import { ArrowUpRightIcon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="brand" href="#main" aria-label="Podscape Labs home">
          <Image src="/assets/logos/podscape-wordmark.svg" alt="Podscape Labs" width={232} height={38} priority />
        </a>
        <nav aria-label="Primary navigation">
          <ul className="nav-links">
            {siteContent.navigation.map((item) => (
              <li key={item.href}><a href={item.href}>{item.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a className="podbound-link" href={siteContent.podbound.url} target="_blank" rel="noreferrer">
            PodBound<ArrowUpRightIcon />
          </a>
        </div>
      </div>
    </header>
  );
}
