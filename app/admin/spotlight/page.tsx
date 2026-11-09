import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSpotlightOptions, getSpotlightSelection } from "@/lib/podscape-spotlights";
import { saveSpotlightSelection } from "./actions";
import styles from "./spotlight.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"Podscape Spotlight | Owner Tools",robots:{index:false,follow:false}};

export default async function SpotlightDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  if(!(await isAdminAuthenticated()))redirect("/admin");
  const [options,selected,query]=await Promise.all([getSpotlightOptions(),getSpotlightSelection(),searchParams]);
  return <main className={styles.page}><div className={styles.wrap}>
    <Link className={styles.back} href="/account/owner-tools">← Owner Tools</Link>
    <header className={styles.header}><p>PODSCAPE LABS / EDITORIAL</p><h1>Spotlight Desk</h1><span>Choose up to five highlights for the homepage carousel. Arrange them in the order you want visitors to see them.</span></header>
    {query.saved&&<p role="status" className={styles.success}>Spotlight selection saved. Your changes will appear on the homepage after this release is deployed.</p>}
    {query.error&&<p role="alert" className={styles.error}>Could not save Spotlights. Check for duplicate choices and ensure the database migration is installed.</p>}
    {selected===null&&<p role="status" className={styles.error}>Spotlight storage isn&apos;t installed yet. The homepage keeps its existing highlights until the release migration is applied.</p>}
    <form action={saveSpotlightSelection} className={styles.form}>
      <div className={styles.sectionHead}><h2>Homepage rotation</h2><small>Swipeable · Manual · No automatic advancement</small></div>
      {Array.from({length:5},(_,i)=><label className={styles.slot} key={i}>
        <span className={styles.number}>{String(i+1).padStart(2,"0")}</span>
        <span className={styles.slotBody}><strong>{i===0?"First highlight":`Highlight ${i+1}`}</strong>
          <select name={`slot${i+1}`} defaultValue={selected?.[i]||""}>
            <option value="">Not used</option>
            {options.map(o=><option value={o.href} key={o.href}>{o.label} · {o.title}</option>)}
          </select>
        </span>
      </label>)}
      <div className={styles.actions}><button type="submit" disabled={selected===null}>Save Spotlight</button><Link href="/app">View homepage →</Link></div>
    </form>
    <p className={styles.foot}>Only published, active content is eligible. If something is unpublished later, it won&apos;t appear in the carousel. Empty slots are skipped. Existing highlights remain visible until you save a selection.</p>
  </div></main>;
}
