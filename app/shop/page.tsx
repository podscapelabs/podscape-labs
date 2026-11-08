/* eslint-disable @next/next/no-img-element */
import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {WorkspaceSectionHeader} from "@/components/PodscapeWorkspaceUI";
import {formatProductPrice,isProductActive,productCategories,type ProductRecord} from "@/data/products";
import {getProductRecords} from "@/lib/product-store";
import styles from "./shop-home.module.css";

export const metadata:Metadata={title:"Shop | PodScape Labs",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";

const paths=[
 {label:"Browse products",icon:"❧",href:"#products"},
 {label:"Categories",icon:"▤",href:"#categories"},
 {label:"Featured",icon:"✦",href:"#featured"},
 {label:"Our community",icon:"✿",href:"#community"}
];

function ShopProductCard({product}:{product:ProductRecord}){
 return <Link href={`/shop/${product.slug}`} className={styles.product}>
  <div className={styles.photo}>{product.image?<img src={product.image} alt={product.imageAlt||product.title} loading="lazy" style={{objectPosition:`${product.imagePositionX}% ${product.imagePositionY}%`,transform:`scale(${product.imageZoom})`}}/>:<span>Photograph coming soon</span>}</div>
  <div className={styles.productBody}><small>{product.category}</small><strong>{product.title}</strong><b>{formatProductPrice(product)}</b><span className={styles.productAction}>View details →</span></div>
 </Link>;
}

export default async function ShopPage({searchParams}:{searchParams:Promise<{category?:string}>}){
 const products=(await getProductRecords()).filter(isProductActive).filter(p=>p.status==="published");
 const requested=(await searchParams).category||"";
 const selectedCategory=productCategories.find(category=>category===requested)||"";
 const categoryCounts=new Map(productCategories.map(category=>[category,products.filter(p=>p.category===category).length]));
 const visible=selectedCategory?products.filter(p=>p.category===selectedCategory):products;
 const featured=products.filter(p=>p.featured).slice(0,4);
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <section className={styles.hero} aria-labelledby="shop-title"><span className={styles.ornament} aria-hidden="true">❧</span><div className={styles.heroCopy}><p className={styles.eyebrow}>PodScape Labs / Shop</p><h1 id="shop-title">The PodScape Shop</h1><p>Curated goods, supplies and creative finds for curious keepers.</p><span className={styles.previewTag}>Storefront preview · Checkout not yet available</span></div></section>
  <Link className={styles.search} href="/search" aria-label="Search across PodScape"><span aria-hidden="true">⌕</span> Search across PodScape <span className={styles.searchArrow} aria-hidden="true">→</span></Link>
  <nav className={styles.paths} aria-label="Shop discovery">{paths.map(item=><Link className={styles.path} href={item.href} key={item.label}><span className={styles.pathIcon} aria-hidden="true">{item.icon}</span><strong>{item.label}</strong></Link>)}</nav>
  <section className={styles.section} id="featured"><WorkspaceSectionHeader title="From the PodScape collection" description="Our featured finds and latest creative projects."/>
   {featured.length?<div className={styles.products}>{featured.map(p=><ShopProductCard product={p} key={p.id}/>)}</div>:<div className={styles.feature}><div><small>Made for curious keepers</small><h2>Something is growing.</h2><p>Our first products and collections are being prepared.</p><Link href="#products">Explore the catalogue →</Link></div></div>}
  </section>
  <section className={styles.section} id="categories"><WorkspaceSectionHeader title="Shop by category" description="Choose a collection to see its products."/>
   <nav className={styles.categories} aria-label="Filter shop by category">
    {productCategories.map((category,index)=><Link aria-current={selectedCategory===category?"page":undefined} className={styles.category} href={`/shop?category=${encodeURIComponent(category)}#products`} key={category}><span aria-hidden="true">{["◌","⚒","▤","❧","♧","✿","✦"][index]}</span><strong>{category}</strong><small>{categoryCounts.get(category)||0} ${(categoryCounts.get(category)||0)===1?"product":"products"}</small></Link>)}
   </nav>
  </section>
  <section className={styles.section} id="products">
   <WorkspaceSectionHeader title={selectedCategory||"All products"} description={selectedCategory?`${visible.length} currently published in this collection`:`${products.length} currently published in our catalogue`} action={selectedCategory?<Link className={styles.clearFilter} href="/shop#products">Clear filter ×</Link>:undefined}/>
   {visible.length?<div className={styles.products}>{visible.map(p=><ShopProductCard product={p} key={p.id}/>)}</div>:<div className={styles.empty}><strong>{selectedCategory?"Nothing published here yet.":"The catalogue is taking shape."}</strong><p>{selectedCategory?"We're preparing this collection. Explore other categories in the meantime.":"Product listings will appear here as soon as they're published."}</p>{selectedCategory?<Link href="/shop#products">View all products →</Link>:null}</div>}
  </section>
  <section className={styles.section} id="community"><div className={styles.community}><small>More than a storefront</small><h2>Made by the community.</h2><p>PodScape is building a home for independent breeders, artists and makers. Vendor shopping and fulfillment are planned for a future phase.</p></div></section>
 </div></main></PlatformShell>;
}
