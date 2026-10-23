import Link from "next/link";
import {ThemeToggle} from "@/components/ThemeToggle";
import {signOutAdmin} from "@/app/admin/actions";
import type {SpeciesRecord} from "@/data/species";
import type {GuideRecord} from "@/data/guides";
import type {ProductRecord} from "@/data/products";
import styles from "./OwnerDashboard.module.css";

type StudioRow={id:string;title:string;kind:string;href:string;status:string;updatedAt:string};
export function OwnerDashboard({species,guides,products,lab}:{
 species:SpeciesRecord[];guides:GuideRecord[];products:ProductRecord[];
 lab:{id:string;title:string;status:string;archivedAt?:string|null;updatedAt:string}[];
}){
 const areas=[
  {title:"Leaf Ledger",label:"Species records",href:"/admin/species",count:species.filter(x=>!x.archivedAt).length,drafts:species.filter(x=>!x.archivedAt&&x.status==="draft").length,icon:"❧"},
  {title:"Products",label:"Shop catalogue",href:"/admin/products",count:products.filter(x=>!x.archivedAt).length,drafts:products.filter(x=>!x.archivedAt&&x.status==="draft").length,icon:"▤"},
  {title:"Field Guides",label:"Care and learning",href:"/admin/guides",count:guides.filter(x=>!x.archivedAt).length,drafts:guides.filter(x=>!x.archivedAt&&x.status==="draft").length,icon:"✎"},
  {title:"From the Lab",label:"Studio articles",href:"/admin/lab",count:lab.filter(x=>!x.archivedAt).length,drafts:lab.filter(x=>!x.archivedAt&&x.status==="draft").length,icon:"✦"}
 ];
 const recent:StudioRow[]=[
  ...species.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.commonName||x.scientificName||"Untitled species",kind:"Species",href:"/admin/species?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt})),
  ...products.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Product",href:"/admin/products?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt})),
  ...guides.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Guide",href:"/admin/guides?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt})),
  ...lab.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Studio note",href:"/admin/lab?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt}))
 ].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt)).slice(0,7);
 const draftCount=areas.reduce((n,a)=>n+a.drafts,0);
 return <div className={styles.page}>
  <div className={styles.inner}>
   <header className={styles.header}><div><p className={styles.eyebrow}>PODSCAPE LABS / PRIVATE WORKSPACE</p><h1>Owner Studio <span aria-hidden="true">❧</span></h1><p>Everything you need to create, edit and publish—without digging through the site.</p></div><div className={styles.headerActions}><ThemeToggle/><Link href="/app" className={styles.quietLink}>Back to PodScape ↗</Link><form action={signOutAdmin}><button type="submit" className={styles.quietLink}>Sign out</button></form></div></header>
   <section className={styles.quick}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>QUICK ACCESS</p><h2>Make something new</h2></div></div><div className={styles.quickGrid}>
    <Link href="/admin/species#studio-create" className={styles.quickCard}><span>❧</span><strong>Species</strong><small>Leaf Ledger →</small></Link>
    <Link href="/admin/products#studio-create" className={styles.quickCard}><span>▤</span><strong>Product</strong><small>From Ledger or blank →</small></Link>
    <Link href="/admin/guides#studio-create" className={styles.quickCard}><span>✎</span><strong>Guide</strong><small>Editorial desk →</small></Link>
    <Link href="/admin/lab#studio-create" className={styles.quickCard}><span>✦</span><strong>Studio note</strong><small>From the Lab →</small></Link>
   </div></section>
   <section className={styles.section}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>YOUR CONTENT</p><h2>Publishing desks</h2></div><span className={styles.summary}>{draftCount} drafts to review</span></div><div className={styles.areaGrid}>{areas.map(a=><Link href={a.href} key={a.href} className={styles.areaCard}><span className={styles.areaIcon}>{a.icon}</span><div className={styles.areaBody}><strong>{a.title}</strong><small>{a.label}</small></div><span className={styles.areaCount}><b>{a.count}</b><small>{a.drafts} drafts</small></span><span className={styles.arrow} aria-hidden="true">→</span></Link>)}</div></section>
   <section className={styles.section}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>PICK UP WHERE YOU LEFT OFF</p><h2>Recently edited</h2></div></div><div className={styles.recentList}>{recent.length?recent.map(x=><Link href={x.href} key={x.kind+x.id} className={styles.recent}><span className={styles.recentText}><strong>{x.title}</strong><small>{x.kind} · {new Date(x.updatedAt).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</small></span><span className={styles.status} data-status={x.status}>{x.status}</span><span className={styles.arrow}>→</span></Link>):<p className={styles.empty}>No records yet. Create your first species, product or guide above.</p>}</div></section>
   <section className={styles.bottomLinks}><Link href="/admin/design-system">Design system ↗</Link><Link href="/admin/preview">Full site preview ↗</Link><Link href="/admin/reset-password">Account security ↗</Link></section>
  </div>
 </div>;
}
