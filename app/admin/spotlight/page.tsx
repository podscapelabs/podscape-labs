import Link from "next/link";
import {OwnerDeskHeader,OwnerDeskNotice} from "@/components/OwnerDeskFoundation";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSpotlightOptions, getSpotlightSelection } from "@/lib/podscape-spotlights";
import { saveSpotlightSelection } from "./actions";
import styles from "./spotlight.module.css";

export const dynamic="force-dynamic";
export const metadata={title:"PodScape Spotlight | Owner Tools",robots:{index:false,follow:false}};

export default async function SpotlightDesk({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  if(!(await isAdminAuthenticated()))redirect("/admin");
  const [options,selected,query]=await Promise.all([getSpotlightOptions(),getSpotlightSelection(),searchParams]);
  const optionHrefs=new Set(options.map(item=>item.href));
  const missing=selected?.filter(href=>!optionHrefs.has(href))||[];
  return <main className={styles.page}><div className={styles.wrap}>
    <OwnerDeskHeader area="Homepage" title="Spotlight Desk" description="Choose which published highlights members see first." icon="creative" actions={[{href:"/app",label:"View homepage",icon:"home",external:true}]}/>
    {query.saved&&<OwnerDeskNotice kind="success">Spotlight selection saved. The homepage reads these exact choices; new content does not replace them.</OwnerDeskNotice>}
    {query.error&&<OwnerDeskNotice kind="error">Could not save Spotlights. Check for duplicate choices and ensure the database migration is installed.</OwnerDeskNotice>}
    {missing.length>0?<OwnerDeskNotice kind="info">{missing.length} saved highlight(s) are unavailable or unpublished. Select replacements and save; PodScape will not automatically substitute new content.</OwnerDeskNotice>:null}
    {selected===null&&<OwnerDeskNotice kind="info">Spotlight storage isn&apos;t installed yet. The homepage keeps its existing highlights until the release migration is applied.</OwnerDeskNotice>}
    <form action={saveSpotlightSelection} className={styles.form}>
      <div className={styles.sectionHead}><h2>Featured highlights</h2><small>Up to five · Displayed in this order</small></div>
      {Array.from({length:5},(_,i)=><label className={styles.slot} key={i}>
        <span className={styles.number}>{String(i+1).padStart(2,"0")}</span>
        <span className={styles.slotBody}><strong>{i===0?"First highlight":`Highlight ${i+1}`}</strong>
          <select name={`slot${i+1}`} defaultValue={selected?.[i]||""}>
            <option value="">Not used</option>
            {selected?.[i]&&!optionHrefs.has(selected?.[i] || "")?<option value={selected[i]} disabled>Unavailable · choose replacement</option>:null}
            {options.map(o=><option value={o.href} key={o.href}>{o.label} · {o.title}</option>)}
          </select>
        </span>
      </label>)}
      <div className={styles.actions}><button type="submit" disabled={selected===null}>Save Spotlight</button><Link href="/app">View homepage →</Link></div>
    </form>
    <details className={styles.help}><summary>How Spotlight works</summary><p>Only published, active content is eligible. Unpublished items are skipped rather than replaced. Leave all slots empty and save to hide Spotlight; Recently Updated remains independent, with automatic content updates and owner-published announcements. New content does not automatically replace your chosen highlights.</p></details>
  </div></main>;
}
