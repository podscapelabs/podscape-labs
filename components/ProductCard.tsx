/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatProductPrice, productAvailabilityLabel, type ProductRecord } from "@/data/products";

export function ProductCard({ product }: { product: ProductRecord }) {
  return <Link className="v2-product-card" href={`/shop/${product.slug}`}><div className="v2-product-image">{product.image ? <img src={product.image} alt={product.imageAlt} style={{ objectPosition: `${product.imagePositionX}% ${product.imagePositionY}%`, transform: `scale(${product.imageZoom})` }} /> : <span><b>Product photograph</b><small>pending</small></span>}<em>{product.status === "draft" ? "Studio draft" : productAvailabilityLabel(product.availability)}</em></div><div className="v2-product-copy"><span>{product.category}</span><h2>{product.title}</h2><p>{product.summary || "Product details are being prepared in the owner studio."}</p><div><strong>{formatProductPrice(product)}</strong><small>View product →</small></div></div></Link>;
}
