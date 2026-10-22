import Link from "next/link";
import { Header } from "@/components/Header";
import styles from "@/components/MarketingHome.module.css";

const items = [
  { href: "/ledger", icon: "◇", title: "Explore Species", copy: "Discover and learn about isopods." },
  { href: "/ledger/my-collection", icon: "▣", title: "My Collection", copy: "Track, manage and care for your collection." },
  { href: "/shop", icon: "▤", title: "Shop", copy: "Supplies, enclosures and more." },
  { href: "/field-guide", icon: "▥", title: "Guides & Resources", copy: "Care sheets, habitats and breeding." },
  { href: "/explore#vendor-directory", icon: "⌂", title: "Vendor Directory", copy: "Find trusted breeders and small businesses." },
  { href: "/explore#creative-network", icon: "◌", title: "Creative Network", copy: "Artists, makers and isopod-inspired creations." },
  { href: "https://www.podbound.net", icon: "▧", title: "PodBound", copy: "The isopod tabletop card game." },
  { href: "/from-the-lab", icon: "◎", title: "Community", copy: "Connect with keepers around the world." },
] as const;

export default function MenuPage(){return <div className={`v2-site ${styles.site}`}><Header/><main className={styles.menuPage}><div className="v2-container"><h1>Menu</h1><p>Explore all that Podscape has to offer.</p><nav className={styles.menuList} aria-label="Podscape destinations">{items.map(item=>item.href.startsWith("http")?<a href={item.href} target="_blank" rel="noreferrer" key={item.title}><i>{item.icon}</i><span><strong>{item.title}</strong><small>{item.copy}</small></span><b>›</b></a>:<Link href={item.href} key={item.title}><i>{item.icon}</i><span><strong>{item.title}</strong><small>{item.copy}</small></span><b>›</b></Link>)}</nav></div></main><nav className={styles.mobileNav} aria-label="Mobile shortcuts"><Link href="/admin/preview"><span>◇</span>Explore</Link><Link href="/ledger"><span>▥</span>Ledger</Link><Link href="/keeper/scan" className={styles.scan}><span>▣</span>Scan</Link><Link href="/ledger/my-collection"><span>□</span>Manager</Link><Link href="/menu" className={styles.active}><span>☰</span>Menu</Link></nav></div>}
