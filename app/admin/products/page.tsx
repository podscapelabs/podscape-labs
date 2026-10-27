import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { formatProductPrice, isProductLowStock, productCategories, productStockQuantity } from "@/data/products";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProductRecords } from "@/lib/product-store";
import { createProductRecord } from "./actions";
import styles from "./products.module.css";

export const dynamic = "force-dynamic";

type ProductDeskParams = { q?: string; category?: string; status?: string };

export default async function ProductDeskPage({ searchParams }: { searchParams: Promise<ProductDeskParams> }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const params = await searchParams;
  const records = await getProductRecords();
  const query = (params.q || "").trim().toLocaleLowerCase("en-CA");
  const category = productCategories.includes(params.category as (typeof productCategories)[number]) ? params.category : "all";
  const status = ["all", "published", "draft", "archived", "low-stock"].includes(params.status || "") ? params.status : "all";
  const visibleRecords = records
    .filter((product) => !query || [product.title, product.category, product.sku, ...(product.variants || []).map((variant) => variant.sku), ...product.tags].join(" ").toLocaleLowerCase("en-CA").includes(query))
    .filter((product) => category === "all" || product.category === category)
    .filter((product) => {
      if (status === "archived") return Boolean(product.archivedAt);
      if (status === "published") return !product.archivedAt && product.status === "published";
      if (status === "draft") return !product.archivedAt && product.status === "draft";
      if (status === "low-stock") return !product.archivedAt && isProductLowStock(product);
      return !product.archivedAt;
    });
  const publishedCount = records.filter((product) => !product.archivedAt && product.status === "published").length;
  const draftCount = records.filter((product) => !product.archivedAt && product.status === "draft").length;
  const lowStockCount = records.filter((product) => !product.archivedAt && isProductLowStock(product)).length;

  return (
    <main className={`admin-shell ${styles.shell}`}>
      <header className={styles.header}>
        <Link className={styles.back} href="/admin" aria-label="Return to Owner Studio">←</Link>
        <div className={styles.heading}><p className="eyebrow">Owner studio · Shop</p><h1>Shop Manager</h1><p>Products, inventory and listings.</p></div>
        <form className={styles.create} action={createProductRecord}><button type="submit"><span aria-hidden="true">＋</span> Create product</button></form>
      </header>
      <section className={styles.stats} aria-label="Shop summary">
        <Link href="/admin/products?status=all"><strong>{records.filter((product) => !product.archivedAt).length}</strong><span>Products</span></Link>
        <Link href="/admin/products?status=published"><strong>{publishedCount}</strong><span>Published</span></Link>
        <Link href="/admin/products?status=draft"><strong>{draftCount}</strong><span>Drafts</span></Link>
        <Link className={lowStockCount ? styles.attention : ""} href="/admin/products?status=low-stock"><strong>{lowStockCount}</strong><span>Low stock</span></Link>
      </section>
      <section className={styles.catalogue} aria-labelledby="catalogue-title">
        <div className={styles.catalogueHead}><div><p className="admin-kicker">Catalogue</p><h2 id="catalogue-title">Products</h2></div><Link href="/shop" target="_blank">Shop preview ↗</Link></div>
        <form className={styles.filters} action="/admin/products" method="get">
          <label className={styles.search}><span className="sr-only">Search products</span><span aria-hidden="true">⌕</span><input type="search" name="q" defaultValue={params.q} placeholder="Search products, SKUs or tags…" /></label>
          <input type="hidden" name="category" value={category} />
          <label><span className="sr-only">Status</span><select name="status" defaultValue={status}><option value="all">Active products</option><option value="published">Published</option><option value="draft">Draft</option><option value="low-stock">Low stock</option><option value="archived">Archived</option></select></label>
          <button className={styles.filterButton} type="submit" aria-label="Apply product filters">↳</button>
        </form>
        <nav className={styles.categoryChips} aria-label="Product categories">
          <Link className={category === "all" ? styles.activeChip : ""} href={`/admin/products?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), status: status || "all" }).toString()}`}>All</Link>
          {productCategories.map((item) => <Link className={category === item ? styles.activeChip : ""} href={`/admin/products?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), category: item, status: status || "all" }).toString()}`} key={item}>{item}</Link>)}
        </nav>
        <div className={styles.tableHead} aria-hidden="true"><span>Product</span><span>Status</span><span>Inventory</span><span>Price</span><span /></div>
        <div className={styles.productList}>
          {visibleRecords.map((product) => {
            const lowStock = isProductLowStock(product);
            return <Link className={styles.productRow} href={`/admin/products/${encodeURIComponent(product.id)}`} key={product.id}>
              <div className={styles.identity}><span className={styles.thumb}>{product.image ? <Image src={product.image} alt="" fill sizes="58px" unoptimized /> : <b aria-hidden="true">❧</b>}</span><span><strong>{product.title}</strong><small>{product.category}{(product.variants?.filter((variant) => variant.isActive).length || 0) > 1 ? ` · ${product.variants?.filter((variant) => variant.isActive).length} variants` : product.sku ? ` · ${product.sku}` : ""}</small></span></div>
              <span className={`${styles.status} ${product.archivedAt ? styles.archived : product.status === "published" ? styles.published : styles.draft}`}>{product.archivedAt ? "Archived" : product.status}</span>
              <span className={lowStock ? styles.stockLow : styles.stock}>{product.availability === "in-stock" ? `${productStockQuantity(product)} in stock` : product.availability.replace("-", " ")}</span>
              <strong className={styles.price}>{formatProductPrice(product)}</strong><span className={styles.open} aria-hidden="true">›</span>
            </Link>;
          })}
          {visibleRecords.length === 0 ? <div className={styles.empty}><span aria-hidden="true">❧</span><h3>No products found.</h3><p>Adjust the filters or create a new product draft.</p></div> : null}
        </div>
      </section>
      <p className={styles.checkoutNote}>Checkout remains disabled. Publishing controls catalogue visibility only until payment processing is connected.</p>
    </main>
  );
}
