import type {Metadata} from "next";
import Link from "next/link";
import {PlatformShell} from "@/components/PlatformShell";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
import {getPublishedUpdates,updateCategories,type UpdateCategory} from "@/lib/podscape-updates";
import {updateCategoryById} from "@/data/update-categories";
import styles from "./updates.module.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Updates & Improvements | PodScape",robots:{index:false,follow:false}};

function validCategory(value:string):value is UpdateCategory{
 return updateCategories.some(category=>category.id===value);
}
function categoryUrl(category?:UpdateCategory){
 return category?`/updates?category=${category}`:"/updates";
}
function readableDate(value:string|null){
 if(!value||!Number.isFinite(Date.parse(value)))return "Recent update";
 return new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(value));
}

/** Only published announcements are shown; Owner Studio drafts never enter this page. */
export default async function UpdatesPage({searchParams}:{searchParams:Promise<{category?:string}>}){
 const params=await searchParams;
 const selected=params.category&&validCategory(params.category)?params.category:null;
 const announcements=await getPublishedUpdates();
 const visible=selected?announcements.filter(entry=>entry.category===selected):announcements;
 return <PlatformShell><main className={styles.page}><div className={styles.wrap}>
  <header className={styles.hero}>
   <span className={styles.eyebrow}>PODSCAPE LABS · RELEASE NOTES</span>
   <h1>Updates &amp; Improvements</h1>
   <p>See what&apos;s changed, what&apos;s new, and how PodScape is growing. Every note below comes from a published platform update.</p>
   <Link href="/app" className={styles.homeLink}>Return to Home <PodscapeLineIcon name="arrow-right"/></Link>
  </header>
  <nav className={styles.filters} aria-label="Filter PodScape updates">
   <Link href={categoryUrl()} className={!selected?styles.active:styles.filter} aria-current={!selected?"page":undefined}>All updates</Link>
   {updateCategories.map(category=><Link key={category.id} href={categoryUrl(category.id)}
    className={selected===category.id?styles.active:styles.filter} aria-current={selected===category.id?"page":undefined}>
    <PodscapeLineIcon name={category.icon}/>{category.label}
   </Link>)}
  </nav>
  <div className={styles.heading}><div><h2>{selected?updateCategoryById[selected].label:"Latest changes"}</h2>
   <p>{visible.length} published {visible.length===1?"update":"updates"}</p></div></div>
  {visible.length===0?<section className={styles.empty}><PodscapeLineIcon name="news"/>
   <h3>No updates here yet</h3><p>Published announcements in this category will appear here automatically.</p>
   {selected?<Link href="/updates">Browse all updates <PodscapeLineIcon name="arrow-right"/></Link>:null}
  </section>:<div className={styles.list}>{visible.map(entry=><article className={styles.entry} key={entry.id} id={`update-${entry.id}`}>
    <div className={styles.entryTop}><span className={styles.category}><PodscapeLineIcon name={updateCategoryById[entry.category]?.icon||"news"}/>
     {updateCategoryById[entry.category]?.label||"PodScape"}</span><time dateTime={entry.published_at||entry.created_at}>{readableDate(entry.published_at||entry.created_at)}</time></div>
    <h3>{entry.title}</h3><p className={styles.summary}>{entry.summary}</p>
    {Array.isArray(entry.details)&&entry.details.length>0?<ul className={styles.details}>{entry.details.map((line,index)=>
     <li key={index}><PodscapeLineIcon name="check"/><span>{line}</span></li>)}</ul>:null}
    {entry.href&&entry.href!=="/app"&&entry.href!=="/updates"?
     <Link className={styles.destination} href={entry.href}>Explore this area <PodscapeLineIcon name="arrow-right"/></Link>:null}
   </article>)}</div>}
  <footer className={styles.footer}>A record of the improvements we&apos;ve made—without the endless scrolling to find out what changed.</footer>
 </div></main></PlatformShell>;
}
