import Image from "next/image";
import Link from "next/link";
import { navigation } from "@/data/platform";
import { ArrowUpRightIcon } from "./Icons";
import { SearchIcon, UserIcon } from "./PlatformIcons";
import { ThemeToggle } from "./ThemeToggle";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";

function PlatformLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return external ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <Link href={href}>{children}</Link>;
}

const mobileDestinations = [
  { href: "/ledger", icon: "leaf", title: "Explore Species", copy: "Discover and learn about isopods." },
  { href: "/ledger/my-collection", icon: "jar", title: "My Collection", copy: "Track, manage and care for your collection." },
  { href: "/shop", icon: "shop", title: "Shop", copy: "Supplies, enclosures and more." },
  { href: "/field-guide", icon: "book", title: "Guides & Resources", copy: "Care sheets, habitats and breeding." },
  { href: "/explore#vendor-directory", icon: "vendor", title: "Vendor Directory", copy: "Find trusted breeders and small businesses." },
  { href: "/explore#creative-network", icon: "creative", title: "Creative Network", copy: "Artists, makers and isopod-inspired creations." },
  { href: "https://www.podbound.net", icon: "podbound", title: "PodBound", copy: "The isopod tabletop card game." },
  { href: "/from-the-lab", icon: "community", title: "Community", copy: "Connect with keepers around the world." },
] satisfies ReadonlyArray<{href:string;icon:PodscapeIconName;title:string;copy:string}>;

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
          <details className="v2-mobile-menu">
            <summary aria-label="Open navigation">Menu</summary>
            <nav aria-label="Mobile navigation">
              <header><strong>Menu</strong><span>Explore all that Podscape has to offer.</span></header>
              {mobileDestinations.map((item) => <PlatformLink href={item.href} key={item.title}><i aria-hidden="true"><PodscapeLineIcon name={item.icon}/></i><span><b>{item.title}</b><small>{item.copy}</small></span><em aria-hidden="true">›</em></PlatformLink>)}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
