import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/data/platform";
import { ArrowUpRightIcon } from "./Icons";
import { SearchIcon, UserIcon } from "./PlatformIcons";
import { ThemeToggle } from "./ThemeToggle";

function PlatformLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return external ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <Link href={href}>{children}</Link>;
}

export function Header() {
  return (
    <header className="v2-header">
      <div className="v2-header-inner v2-container">
        <Link className="v2-brand" href="/admin/preview" aria-label="Podscape Labs preview home">
          <Image src="/assets/logos/podscape-wordmark.svg" alt="Podscape Labs" width={232} height={38} priority />
          <span>Independent Canadian Studio</span>
        </Link>
        <nav className="v2-desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => <PlatformLink href={item.href} key={item.label}>{item.label}</PlatformLink>)}
        </nav>
        <div className="v2-header-tools">
          <Link className="v2-icon-button v2-search-button" href="/search" aria-label="Search Podscape"><SearchIcon /></Link>
          <Link className="v2-icon-button v2-account-button" href="/account" aria-label="Your Podscape account"><UserIcon /></Link>
          <ThemeToggle />
          <a className="v2-podbound-cta" href="https://www.podbound.net" target="_blank" rel="noreferrer">PodBound <ArrowUpRightIcon /></a>

        </div>
      </div>
    </header>
  );
}
