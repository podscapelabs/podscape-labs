import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { ProductCard } from "@/components/ProductCard";
import { isProductActive, productCategories } from "@/data/products";
import { getProductRecords } from "@/lib/product-store";

export const metadata: Metadata = { title: "Shop | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = (await getProductRecords()).filter(isProductActive);
  const featured = products.filter((product) => product.featured);
  return <PlatformShell><PlatformPageHeader eyebrow="Tools, guides, and studio goods" title="The Podscape Shop" intro="A considered collection of practical tools, field resources, and original goods for isopod keepers." index="SHOP / 001" /><section className="v2-shop-intro"><div className="v2-container v2-shop-intro-grid"><div><p className="v2-kicker">Storefront foundation</p><h2>Useful things for thoughtful keepers.</h2><p>The catalogue is being assembled inside the owner studio. Products can be previewed here, but checkout remains intentionally offline until Shopify is connected.</p></div><aside><span>Checkout status</span><strong>Not connected</strong><p>No payment information can be entered or collected in this preview.</p></aside></div></section>{featured.length ? <section className="v2-shop-featured"><div className="v2-container"><div className="v2-section-line"><h2>Studio selections</h2><span>Featured products</span></div><div className="v2-product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div></div></section> : null}<section className="v2-page-section"><div className="v2-container"><div className="v2-shop-categories"><p className="v2-kicker">Browse the future catalogue</p><div>{productCategories.map((category, index) => <span key={category}><b>{String(index + 1).padStart(2, "0")}</b>{category}</span>)}</div></div><div className="v2-section-line v2-shop-product-heading"><h2>All products</h2><span>{products.length} catalogue records</span></div>{products.length ? <div className="v2-product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="v2-shop-empty"><div><span>01</span><b>Product photography</b><small>Ready for owner uploads</small></div><div><span>02</span><b>Product details</b><small>Managed in the Product desk</small></div><div><span>03</span><b>Checkout</b><small>Shopify connection later</small></div><h2>The shelves are ready.</h2><p>Create the first product in the owner studio to populate this catalogue.</p><Link className="v2-button v2-button-outline" href="/admin/products">Open Product desk →</Link></div>}</div></section></PlatformShell>;
}
