import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/data/platform";
import { UserIcon } from "./PlatformIcons";
import { HeaderSearch } from "./HeaderSearch";
import { ThemeToggle } from "./ThemeToggle";

function PlatformLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return external ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <Link href={href}>{children}</Link>;
}

export function Header() {
  return (
    <header className="v2-header">
      <div className="v2-header-inner v2-container">
        <Link className="v2-brand" href="/app" aria-label="PodScape Labs app home">
          <Image src="/assets/logos/podscape-wordmark.svg" alt="PodScape Labs" width={232} height={38} priority />
          <span>Independent Canadian Studio</span>
        </Link>
        <nav className="v2-desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => <PlatformLink href={item.href} key={item.label}>{item.label}</PlatformLink>)}
        </nav>
        <div className="v2-header-tools">
          <HeaderSearch/>
          <Link className="v2-icon-button v2-account-button" href="/account" aria-label="Your PodScape account"><UserIcon /></Link>
          <ThemeToggle />
          <Link className="v2-podbound-cta" href="/podbound">PodBound <span aria-hidden="true">→</span></Link>

        </div>
      </div>
    </header>
  );
}
