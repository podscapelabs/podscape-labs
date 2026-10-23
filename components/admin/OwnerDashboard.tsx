import Image from "next/image";
import Link from "next/link";
import {PodscapeLineIcon,type PodscapeIconName} from "@/components/PodscapeLineIcon";
import type {SpeciesRecord} from "@/data/species";
import type {GuideRecord} from "@/data/guides";
import type {ProductRecord} from "@/data/products";
import styles from "./OwnerDashboard.module.css";

type LabSummary={id:string;title:string;status:string;archivedAt?:string|null;updatedAt:string};
type StudioRow={id:string;title:string;kind:string;href:string;status:string;updatedAt:string;image?:string|null;subtitle?:string};
type Desk={name:string;description:string;href:string;icon:PodscapeIconName;tone:string};

export function OwnerDashboard({species,guides,products,lab}:{
 species:SpeciesRecord[];guides:GuideRecord[];products:ProductRecord[];lab:LabSummary[];
}){
 const desks:Desk[]=[
  {name:"Shop Manager",description:"Products, pricing, stock and listings",href:"/admin/products",icon:"shop",tone:"green"},
  {name:"Species Desk",description:"Ledger identities and care",href:"/admin/species",icon:"leaf",tone:"rose"},
  {name:"Guide Desk",description:"Write, edit and publish",href:"/admin/guides",icon:"book",tone:"green"},
  {name:"Lab Desk",description:"Project updates and notes",href:"/admin/lab",icon:"note",tone:"sand"}
 ];
 const all:StudioRow[]=[
  ...species.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.commonName||x.scientificName||"Untitled species",kind:"Species",href:"/admin/species?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt,image:x.image,subtitle:x.scientificName})),
  ...products.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Product",href:"/admin/products?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt,image:x.image,subtitle:x.category})),
  ...guides.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Guide",href:"/admin/guides?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt,subtitle:x.category})),
  ...lab.filter(x=>!x.archivedAt).map(x=>({id:x.id,title:x.title,kind:"Lab note",href:"/admin/lab?record="+encodeURIComponent(x.id),status:x.status,updatedAt:x.updatedAt,subtitle:"From the Lab"}))
 ].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
 const drafts=all.filter(x=>x.status==="draft");
 const published=all.filter(x=>x.status==="published");
 const recent=all.slice(0,4);
 const heroPhoto=species.find(x=>!x.archivedAt && x.image)?.image;
 return <div className={styles.page}><div className={styles.inner}>
  <section className={styles.hero} aria-labelledby="owner-studio-heading">
   {heroPhoto?<Image src={heroPhoto} alt="" fill sizes="(max-width: 720px) 65vw, 480px" className={styles.heroPhoto} priority/>:null}
   <div className={styles.heroCopy}><p className={styles.kicker}>PODSCAPE / OWNER WORKSPACE</p><h1 id="owner-studio-heading">Owner Studio</h1><p>Make, manage and publish your work—all in one place.</p><Link href="/admin/products#studio-create" className={styles.heroButton}>Create something <span aria-hidden="true">→</span></Link></div>
   <span className={styles.heroSeal}>Small<br/>creatures.<br/>Big world.</span>
  </section>
  <section className={styles.section} aria-labelledby="owner-desks-title">
   <div className={styles.sectionHead}><h2 id="owner-desks-title">Your desks</h2><Link href="/account">My Account <span aria-hidden="true">→</span></Link></div>
   <nav className={styles.deskGrid} aria-label="Owner publishing desks">{desks.map(d=><Link href={d.href} key={d.name} className={styles.deskCard} data-tone={d.tone}><span className={styles.deskIcon}><PodscapeLineIcon name={d.icon}/></span><span className={styles.deskArrow} aria-hidden="true">↗</span><strong>{d.name}</strong><small>{d.description}</small></Link>)}</nav>
  </section>
  <div className={styles.split}>
   <section className={styles.panel} aria-labelledby="owner-recent-title"><div className={styles.panelHead}><h2 id="owner-recent-title">Recent Activity</h2><Link href="/admin/products">View desks →</Link></div>
    {recent.length?<div className={styles.entries}>{recent.map(item=><RecordRow item={item} key={item.kind+item.id}/>)}</div>:<p className={styles.empty}>No edits yet. Add a product, guide or species to begin.</p>}
   </section>
   <div className={styles.sideColumn}><section className={styles.panel} aria-labelledby="owner-drafts-title"><div className={styles.panelHead}><h2 id="owner-drafts-title">Draft Queue</h2><span>{drafts.length} drafts</span></div>
     {drafts.length?<div className={styles.entries}>{drafts.slice(0,3).map(item=><RecordRow item={item} key={item.kind+item.id}/>)}</div>:<p className={styles.empty}>All caught up—no drafts waiting.</p>}
     {drafts.length>3?<p className={styles.queueNote}>+ {drafts.length-3} more across your desks</p>:null}
    </section>
    <section className={styles.panel} aria-labelledby="owner-create-title"><div className={styles.panelHead}><h2 id="owner-create-title">Quick Create</h2></div><nav className={styles.createGrid} aria-label="Create new content">
     <Link href="/admin/products#studio-create"><PodscapeLineIcon name="shop"/><span>New<br/>Product</span></Link>
     <Link href="/admin/species#studio-create"><PodscapeLineIcon name="leaf"/><span>New<br/>Species</span></Link>
     <Link href="/admin/guides#studio-create"><PodscapeLineIcon name="book"/><span>New<br/>Guide</span></Link>
     <Link href="/admin/lab#studio-create"><PodscapeLineIcon name="note"/><span>Lab<br/>Note</span></Link>
    </nav></section></div>
  </div>
  <section className={styles.section} aria-labelledby="owner-shortcuts-title"><div className={styles.sectionHead}><h2 id="owner-shortcuts-title">Helpful Shortcuts</h2></div>
   <nav className={styles.shortcutGrid} aria-label="Owner tools">
    <Link href="/admin/products#studio-create"><span className={styles.shortcutIcon}><PodscapeLineIcon name="leaf"/></span><span><strong>Use Ledger Entry</strong><small>Start a product using species data</small></span><b>→</b></Link>
    <Link href="/admin/guides#studio-create"><span className={styles.shortcutIcon}><PodscapeLineIcon name="book"/></span><span><strong>Guide Templates</strong><small>Start with a section structure</small></span><b>→</b></Link>
    <Link href="/admin/products"><span className={styles.shortcutIcon}><PodscapeLineIcon name="shop"/></span><span><strong>Open Shop Manager</strong><small>Manage products, inventory and prices</small></span><b>→</b></Link>
   </nav>
  </section>
  <section className={styles.section} aria-labelledby="owner-overview-title"><div className={styles.sectionHead}><h2 id="owner-overview-title">At a Glance</h2></div><div className={styles.statGrid}>
    <Link href="/admin/species"><strong>{species.filter(x=>!x.archivedAt).length}</strong><span>Species records</span></Link>
    <Link href="/admin/products"><strong>{products.filter(x=>!x.archivedAt).length}</strong><span>Products</span></Link>
    <Link href="/admin/guides"><strong>{guides.filter(x=>!x.archivedAt).length}</strong><span>Guides</span></Link>
    <Link href="/admin/products"><strong>{published.length}</strong><span>Published items</span></Link>
   </div></section>
  <section className={styles.managerLink}><span className={styles.managerGlyph}><PodscapeLineIcon name="jar"/></span><div><strong>My Colonies</strong><p>Bin records, care, scanning and maintenance live in your Manager workspace.</p></div><Link href="/keeper">Open Manager →</Link></section>
  <footer className={styles.footer}><Link href="/admin/design-system">Design system</Link><Link href="/admin/preview">Private site preview</Link><Link href="/admin/reset-password">Owner security</Link></footer>
 </div></div>;
}
function RecordRow({item}:{item:StudioRow}){
 return <Link href={item.href} className={styles.record}>
  <span className={styles.thumb}>{item.image?<Image src={item.image} alt="" fill sizes="58px"/>:<PodscapeLineIcon name={item.kind==="Guide"?"book":item.kind==="Lab note"?"note":"leaf"}/>}</span>
  <span className={styles.recordCopy}><strong>{item.title}</strong><small>{item.kind}{item.subtitle?" · "+item.subtitle:""}</small></span>
  <span className={styles.recordStatus} data-status={item.status}>{item.status}</span><span aria-hidden="true" className={styles.chevron}>›</span>
 </Link>;
}
