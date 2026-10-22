import Link from "next/link";
import { Header } from "@/components/Header";
import styles from "@/components/MarketingHome.module.css";
import { PodscapeLineIcon, type PodscapeIconName } from "@/components/PodscapeLineIcon";

const items = [
  { href: "/ledger", icon: "leaf", title: "Explore Species", copy: "Discover and learn about isopods." },
  { href: "/ledger/my-collection", icon: "jar", title: "My Collection", copy: "Track, manage and care for your collection." },
  { href: "/shop", icon: "shop", title: "Shop", copy: "Supplies, enclosures and more." },
  { href: "/field-guide", icon: "book", title: "Guides & Resources", copy: "Care sheets, habitats and breeding." },
  { href: "/fun-zone", icon: "community", title: "Fun Zone", copy: "Daily rewards, puzzles, quizzes and more." },
  { href: "/explore#vendor-directory", icon: "vendor", title: "Vendor Directory", copy: "Find trusted breeders and small businesses." },
  { href: "/explore#creative-network", icon: "creative", title: "Creative Network", copy: "Artists, makers and isopod-inspired creations." },
  { href: "https://www.podbound.net", icon: "podbound", title: "PodBound", copy: "The isopod tabletop card game." },
  { href: "/from-the-lab", icon: "community", title: "Community", copy: "Connect with keepers around the world." },
] satisfies ReadonlyArray<{href:string;icon:PodscapeIconName;title:string;copy:string}>;

export default function MenuPage(){return <div className={`v2-site ${styles.site}`}><Header/><main className={styles.menuPage}><div className="v2-container"><h1>Menu</h1><p>Explore all that Podscape has to offer.</p><nav className={styles.menuList} aria-label="Podscape destinations">{items.map(item=>item.href.startsWith("http")?<a href={item.href} target="_blank" rel="noreferrer" key={item.title}><i><PodscapeLineIcon name={item.icon}/></i><span><strong>{item.title}</strong><small>{item.copy}</small></span><b>›</b></a>:<Link href={item.href} key={item.title}><i><PodscapeLineIcon name={item.icon}/></i><span><strong>{item.title}</strong><small>{item.copy}</small></span><b>›</b></Link>)}</nav></div></main><nav className={styles.mobileNav} aria-label="Mobile shortcuts"><Link href="/admin/preview"><span><PodscapeLineIcon name="home"/></span>Explore</Link><Link href="/ledger"><span><PodscapeLineIcon name="book"/></span>Ledger</Link><Link href="/keeper/scan" className={styles.scan}><span><PodscapeLineIcon name="scan"/></span>Scan</Link><Link href="/keeper"><span><PodscapeLineIcon name="manager"/></span>Manager</Link><Link href="/menu" className={styles.active}><span><PodscapeLineIcon name="menu"/></span>Menu</Link></nav></div>}
