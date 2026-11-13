import Link from "next/link";
import {OwnerDeskRecordFilters,OwnerDeskRecordCount} from "@/components/OwnerDeskRecordBrowser";
import {OwnerDeskHeader} from "@/components/OwnerDeskFoundation";
import Image from "next/image";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {cardCategories,getPodBoundArtworkUrl,getPodBoundCards} from "@/lib/podbound-cards";
import {createPodBoundCard} from "./actions";
import styles from "./desk.module.css";
import {PodscapeLineIcon} from "@/components/PodscapeLineIcon";
export const dynamic="force-dynamic";

export default async function CardDesk({searchParams}:{searchParams:Promise<{q?:string;category?:string;status?:string}>}){
  if(!await isAdminAuthenticated())redirect("/admin");
  const params=await searchParams;
  const cards=await getPodBoundCards();
  const q=(params.q||"").trim().toLocaleLowerCase("en-CA");
  const category=cardCategories.includes(params.category as typeof cardCategories[number])?params.category||"all":"all";
  const status=["all","draft","published","archived"].includes(params.status||"")?params.status||"all":"all";
  const visible=cards.filter(c=>(!q||[c.title,c.card_number,c.set_name,c.category,c.summary].join(" ").toLowerCase().includes(q))&&(category==="all"||c.category===category)&&(status==="all"?c.status!=="archived":c.status===status));
  const imageUrls=await Promise.all(visible.map(c=>getPodBoundArtworkUrl(c.core_art_path)));
  return <main className={styles.shell}>
    <OwnerDeskHeader area="PodBound" title="Card Desk" description="Manage artwork, mechanics, and your card catalogue." icon="podbound" actions={[{href:"/podbound/cards",label:"View cards",icon:"podbound",external:true}]} aside={<form action={createPodBoundCard}><button className={styles.primary} type="submit">＋ New card</button></form>}/>
    <section className={styles.stats}><Link href="/admin/podbound"><strong>{cards.filter(c=>c.status!=="archived").length}</strong><span>Active cards</span></Link><Link href="/admin/podbound?status=draft"><strong>{cards.filter(c=>c.status==="draft").length}</strong><span>Drafts</span></Link><Link href="/admin/podbound?status=published"><strong>{cards.filter(c=>c.status==="published").length}</strong><span>Published</span></Link><Link href="/admin/podbound?status=archived"><strong>{cards.filter(c=>c.status==="archived").length}</strong><span>Archived</span></Link></section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><p className={styles.eyebrow}>THE COLLECTION</p><h2>Card records</h2></div><small>Browse and edit your collection</small></div>
      <OwnerDeskRecordFilters action="/admin/podbound" searchLabel="Search cards" searchPlaceholder="Search cards, sets or numbers…" searchValue={params.q||""} clearHref="/admin/podbound" filters={[
        {name:"category",label:"Category",value:category,options:[{value:"all",label:"All categories"},...cardCategories.map(c=>({value:c,label:c[0].toUpperCase()+c.slice(1)}))]},
        {name:"status",label:"Publication",value:status,options:[{value:"all",label:"Active cards"},{value:"draft",label:"Draft"},{value:"published",label:"Published"},{value:"archived",label:"Archived"}]}
      ]}/>
      <nav className={styles.chips} aria-label="Card category shortcuts"><Link aria-current={category==="all"?"page":undefined} className={category==="all"?styles.selected:""} href={"/admin/podbound?"+new URLSearchParams({...params.q?{q:params.q}:{},...status!=="all"?{status}:{}})}>All</Link>{cardCategories.map(c=><Link aria-current={category===c?"page":undefined} className={category===c?styles.selected:""} href={"/admin/podbound?"+new URLSearchParams({...params.q?{q:params.q}:{},...status!=="all"?{status}:{},category:c})} key={c}>{c[0].toUpperCase()+c.slice(1)}</Link>)}</nav>
      <OwnerDeskRecordCount shown={visible.length} total={cards.filter(c=>status==="all"?c.status!=="archived":c.status===status).length} noun="cards" detail="Latest edits first"/>
      <div className={styles.list}>{visible.map((card,i)=><Link className={styles.item} key={card.id} href={"/admin/podbound/"+card.id}><span className={styles.thumbnail}>{imageUrls[i]?<Image src={imageUrls[i]!} alt="" fill unoptimized sizes="64px"/>:<PodscapeLineIcon name="podbound"/>}</span><span className={styles.identity}><strong>{card.title}</strong><small>{card.card_number?card.card_number+" · ":""}{card.set_name} · {card.category}{card.alternate_art_path?" · Alt art":""}</small></span><span className={styles.pill} data-status={card.status}>{card.status}</span><span className={styles.arrow}>→</span></Link>)}
      {!visible.length&&<div className={styles.empty}><PodscapeLineIcon name="podbound"/><h3>No cards here yet.</h3><p>Create your first draft, or adjust your filters.</p><form action={createPodBoundCard}><button className={styles.primary}>Create a card</button></form></div>}</div>
    </section>
    <p className={styles.note}>Only you can manage this archive. Publishing a card stores its status; the public Card Gallery will be connected in the next phase.</p>
  </main>;
}
