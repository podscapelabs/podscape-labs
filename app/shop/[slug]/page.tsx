/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PlatformShell } from "@/components/PlatformShell";
import { formatProductPrice, productAvailabilityLabel } from "@/data/products";
import { getProductRecord } from "@/lib/product-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const product = await getProductRecord((await params).slug); return { title: product ? `${product.title} | Podscape Shop` : "Product | Podscape Shop", robots: { index: false, follow: false } }; }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductRecord((await params).slug);
  if (!product) notFound();
  if (product.status !== "published" && !(await isAdminAuthenticated())) notFound();
  return <PlatformShell><div className="v2-container v2-product-page"><Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: product.title }]} /><section className="v2-product-hero"><div className="v2-product-detail-image">{product.image ? <img src={product.image} alt={product.imageAlt} style={{ objectPosition: `${product.imagePositionX}% ${product.imagePositionY}%`, transform: `scale(${product.imageZoom})` }} /> : <span><b>Product photograph</b><small>Owner upload pending</small></span>}</div><div className="v2-product-detail-copy"><p className="v2-label">{product.category} · {product.status === "draft" ? "Studio draft" : productAvailabilityLabel(product.availability)}</p><h1>{product.title}</h1><p className="v2-product-price">{formatProductPrice(product)} <span>CAD</span></p><p className="v2-product-summary">{product.summary || "Product summary pending."}</p>{product.optionType && product.optionType !== "none" && product.variants?.length ? <ProductVariantSelector variants={product.variants} optionType={product.optionType} currency={product.currency}/> : null}<button className="v2-button v2-button-primary" type="button" disabled>Checkout coming later</button><small>Shopify is not connected. This preview cannot accept orders or payment information.</small></div></section><section className="v2-product-information"><div><p className="v2-kicker">Product notes</p><h2>Made to be useful.</h2></div><div><p>{product.description || "The full product description will appear here once it is written in the owner studio."}</p>{product.materials ? <dl><dt>Materials or contents</dt><dd>{product.materials}</dd></dl> : null}{product.shippingNote ? <dl><dt>Shipping note</dt><dd>{product.shippingNote}</dd></dl> : null}</div></section><aside className="v2-shop-offline-note"><strong>Storefront preview only</strong><p>Product records, photographs, and presentation are active. Inventory syncing, cart, checkout, payment, taxes, and order handling will be added through Shopify later.</p><Link href="/shop">Return to the Shop →</Link></aside></div></PlatformShell>;
}
