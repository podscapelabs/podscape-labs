import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "@/components/PlatformShell";
import { formatProductPrice, isProductActive } from "@/data/products";
import { getProductRecords } from "@/lib/product-store";
import styles from "./shop-home.module.css";

export const metadata: Metadata = { title: "Shop | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const paths = [
  { label: "PodScape Products", icon: "❧", href: "#products" },
  { label: "Makers & Artists", icon: "✿", href: "#community" },
  { label: "Isopod Vendors", icon: "⌂", href: "#community" },
  { label: "Collections", icon: "✦", href: "#collections" },
];
const categories = [
  { label: "Isopods & Springtails", icon: "◌" },
  { label: "Habitat Supplies", icon: "❧" },
  { label: "Apparel", icon: "♧" },
  { label: "Prints & Collectibles", icon: "✿" },
  { label: "Books & Journals", icon: "▤" },
  { label: "Field Tools", icon: "⚒" },
];
export default async function ShopPage() {
  const products = (await getProductRecords()).filter(isProductActive).filter((p) => p.status === "published");
  const featured = [...products].sort((a,b) => Number(b.featured) - Number(a.featured)).slice(0, 4);
  return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
    <section className={styles.hero} aria-labelledby="shop-title"><span className={styles.ornament} aria-hidden="true">❧</span><div className={styles.heroCopy}><p className={styles.eyebrow}>Welcome to the shop</p><h1 id="shop-title">The PodScape Shop</h1><p>Curated goods, supplies and creative finds for the curious keeper.</p></div></section>
    <Link className={styles.search} href="/search" aria-label="Search PodScape products"><span aria-hidden="true">⌕</span> Search the shop and beyond →</Link>
    <nav className={styles.paths} aria-label="Shop discovery"><>{paths.map((item) => <Link className={styles.path} href={item.href} key={item.label}><span className={styles.pathIcon} aria-hidden="true">{item.icon}</span><strong>{item.label}</strong></Link>)}</></nav>
    <section className={styles.section} id="collections"><div className={styles.heading}><h2>Curated for keepers</h2></div><div className={styles.feature}><div><small>From the PodScape collection</small><h2>Habitat essentials</h2><p>Thoughtful finds for building a thriving little world.</p><Link href="#categories">Explore categories →</Link></div></div></section>
    <section className={styles.section} id="categories"><div className={styles.heading}><h2>Shop by category</h2></div><div className={styles.categories}>{categories.map((item) => <Link className={styles.category} href="#products" key={item.label}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong></Link>)}</div></section>
    <section className={styles.section} id="products"><div className={styles.heading}><h2>Featured products</h2><Link href="#products">Browse products →</Link></div>{featured.length ? <div className={styles.products}>{featured.map((p) => <Link href={`/shop/${p.slug}`} className={styles.product} key={p.id}><div className={styles.photo}>{p.image ? <img src={p.image} alt={p.imageAlt || p.title} /> : <span>Photograph coming soon</span>}</div><div className={styles.productBody}><small>{p.category}</small><strong>{p.title}</strong><b>{formatProductPrice(p)}</b></div></Link>)}</div> : <p className={styles.empty}>Our first collections are taking shape. Check back soon for new discoveries.</p>}</section>
    <section className={styles.section} id="community"><div className={styles.community}><small>More than a storefront</small><h2>Made by the community.</h2><p>PodScape is growing into a place to discover independent breeders, artists and makers. Vendor shopping and fulfillment options are planned for a future phase.</p></div></section>
  </div></main></PlatformShell>;
}
