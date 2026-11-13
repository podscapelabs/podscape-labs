/* eslint-disable @next/next/no-img-element */
import {PortalShortcutDock} from "@/components/PortalShortcutDock";
import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {WorkspaceSectionHeader} from "@/components/PodscapeWorkspaceUI";
import {formatProductPrice,isProductActive,productCategories,type ProductRecord} from "@/data/products";
import {getProductRecords} from "@/lib/product-store";
import styles from "./shop-home.module.css";
import { PodscapeLineIcon, type PodscapeIconName } from "@/components/PodscapeLineIcon";

export const metadata:Metadata={title:"Shop | PodScape Labs",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";

const categoryIcons: PodscapeIconName[] = ["shop", "creative", "book", "leaf", "jar", "community", "podbound"];
const paths: {label:string;icon:PodscapeIconName;href:string}[]=[
 {label:"Browse products",icon:"shop",href:"#products"},
 {label:"Categories",icon:"menu",href:"#categories"},
 {label:"Featured",icon:"creative",href:"#featured"},
 {label:"Vendor Directory",icon:"community",href:"/shop/vendors"}
];

function ShopProductCard({product}:{product:ProductRecord}){
 return <Link href={`/shop/${product.slug}`} className={styles.product}>
  <div className={styles.photo}>{product.image?<img src={product.image} alt={product.imageAlt||product.title} loading="lazy" style={{objectPosition:`${product.imagePositionX}% ${product.imagePositionY}%`,transform:`scale(${product.imageZoom})`}}/>:<span>Photograph coming soon</span>}</div>
  <div className={styles.productBody}><small>{product.category}</small><strong>{product.title}</strong><b>{formatProductPrice(product)}</b><span className={styles.productAction}>View details →</span></div>
 </Link>;
}

export default async function ShopPage({searchParams}:{searchParams:Promise<{category?:string;q?:string}>}){
 const products=(await getProductRecords()).filter(isProductActive).filter(p=>p.status==="published");
 const params=await searchParams;
 const requested=params.category||"";
 const query=(params.q||"").trim().slice(0,100);
 const normalizedQuery=query.toLocaleLowerCase();
 const selectedCategory=productCategories.find(category=>category===requested)||"";
 const categoryCounts=new Map(productCategories.map(category=>[category,products.filter(p=>p.category===category).length]));
 const visible=products.filter(p=>(!selectedCategory||p.category===selectedCategory)&&(!normalizedQuery||[p.title,p.category,p.summary,p.description].some(value=>typeof value==="string"&&value.toLocaleLowerCase().includes(normalizedQuery))));
 const featured=products.filter(p=>p.featured).slice(0,4);
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <section className={styles.hero} aria-labelledby="shop-title"><div className={styles.heroCopy}><p className={styles.eyebrow}>PodScape Labs / Shop</p><h1 id="shop-title">The PodScape Shop</h1><p>Curated goods, supplies and creative finds for curious keepers.</p><span className={styles.previewTag}>Storefront preview · Checkout not yet available</span></div></section>
  <form className={styles.search} action="/shop" method="get" role="search" aria-label="Search Shop products"><span aria-hidden="true"><PodscapeLineIcon name="search" /></span><input name="q" type="search" aria-label="Search Shop products" placeholder="Search products…" defaultValue={query} maxLength={100} autoComplete="off"/>{selectedCategory?<input type="hidden" name="category" value={selectedCategory}/>:null}<button type="submit" className={styles.searchSubmit} aria-label="Search products">Search →</button></form>
  <PortalShortcutDock portal="shop" label="Shop shortcuts" defaults={["products","categories","featured","vendors"]} features={[...paths.map((item,index)=>({id:["products","categories","featured","vendors"][index],label:item.label,icon:item.icon,href:item.href})),{id:"community",label:"Community makers",icon:"community",href:"#community"}]}/>
  <section className={styles.section} id="featured"><WorkspaceSectionHeader title="From the PodScape collection" description="Our featured finds and latest creative projects."/>
   {featured.length?<div className={styles.products}>{featured.map(p=><ShopProductCard product={p} key={p.id}/>)}</div>:<div className={styles.feature}><div><small>Made for curious keepers</small><h2>Something is growing.</h2><p>Our first products and collections are being prepared.</p><Link href="#products">Explore the catalogue →</Link></div></div>}
  </section>
  <section className={styles.section} id="categories"><WorkspaceSectionHeader title="Shop by category" description="Choose a collection to see its products."/>
   <nav className={styles.categories} aria-label="Filter shop by category">
    {productCategories.map((category,index)=><Link aria-current={selectedCategory===category?"page":undefined} className={styles.category} href={`/shop?category=${encodeURIComponent(category)}${query?`&q=${encodeURIComponent(query)}`:""}#products`} key={category}><span aria-hidden="true"><PodscapeLineIcon name={categoryIcons[index % categoryIcons.length]} /></span><strong>{category}</strong><small>{categoryCounts.get(category)||0} ${(categoryCounts.get(category)||0)===1?"product":"products"}</small></Link>)}
   </nav>
  </section>
  <section className={styles.section} id="products">
   <WorkspaceSectionHeader title={query?`Results for “${query}”`:selectedCategory||"All products"} description={query?`${visible.length} matching product${visible.length===1?"":"s"}${selectedCategory?` in ${selectedCategory}`:""}`:selectedCategory?`${visible.length} currently published in this collection`:`${products.length} currently published in our catalogue`} action={selectedCategory||query?<Link className={styles.clearFilter} href="/shop#products">Clear filters ×</Link>:undefined}/>
   {visible.length?<div className={styles.products}>{visible.map(p=><ShopProductCard product={p} key={p.id}/>)}</div>:<div className={styles.empty}><strong>{query?"No matching products.":selectedCategory?"Nothing published here yet.":"The catalogue is taking shape."}</strong><p>{selectedCategory?"We're preparing this collection. Explore other categories in the meantime.":"Product listings will appear here as soon as they're published."}</p>{selectedCategory||query?<Link href="/shop#products">View all products →</Link>:null}</div>}
  </section>
  <section className={styles.section} id="community"><div className={styles.community}><small>More than a storefront</small><h2>Made by the community.</h2><p>Discover independent breeders, artists and makers through the PodScape Vendor Directory. Vendor purchases happen on their own websites.</p><Link href="/shop/vendors">Explore Vendor Directory →</Link></div></section>
 </div></main></PlatformShell>;
}
