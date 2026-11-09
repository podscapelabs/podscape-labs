import Link from "next/link";
import Image from "next/image";
import {redirect} from "next/navigation";
import {isAdminAuthenticated} from "@/lib/admin-auth";
import {cardCategories,getPodBoundArtworkUrl,getPodBoundCards} from "@/lib/podbound-cards";
import {createPodBoundCard} from "./actions";
import styles from "./desk.module.css";
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
    <header className={styles.top}><Link href="/admin" className={styles.back} aria-label="Owner Studio">←</Link><div><p className={styles.eyebrow}>OWNER STUDIO / PODBOUND</p><h1>Card Desk</h1><p>Every little world begins with a card. ✦</p></div><form action={createPodBoundCard}><button className={styles.primary}>＋ New card</button></form></header>
    <section className={styles.stats}><Link href="/admin/podbound"><strong>{cards.filter(c=>c.status!=="archived").length}</strong><span>Active cards</span></Link><Link href="/admin/podbound?status=draft"><strong>{cards.filter(c=>c.status==="draft").length}</strong><span>Drafts</span></Link><Link href="/admin/podbound?status=published"><strong>{cards.filter(c=>c.status==="published").length}</strong><span>Published</span></Link><Link href="/admin/podbound?status=archived"><strong>{cards.filter(c=>c.status==="archived").length}</strong><span>Archived</span></Link></section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><p className={styles.eyebrow}>THE COLLECTION</p><h2>Card archive</h2></div><small>Artwork and mechanics are managed separately.</small></div>
      <form className={styles.filters} action="/admin/podbound"><input aria-label="Search cards" type="search" name="q" defaultValue={params.q||""} placeholder="Search cards, sets or numbers…"/><select name="category" aria-label="Card category" defaultValue={category}><option value="all">All categories</option>{cardCategories.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select><select name="status" aria-label="Publication status" defaultValue={status}><option value="all">Active cards</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button type="submit">Filter</button></form>
      <div className={styles.chips}><Link className={category==="all"?styles.selected:""} href="/admin/podbound">All</Link>{cardCategories.map(c=><Link className={category===c?styles.selected:""} href={"/admin/podbound?category="+c} key={c}>{c[0].toUpperCase()+c.slice(1)}</Link>)}</div>
      <p className={styles.count}>Showing {visible.length} cards · Latest edits first</p>
      <div className={styles.list}>{visible.map((card,i)=><Link className={styles.item} key={card.id} href={"/admin/podbound/"+card.id}><span className={styles.thumbnail}>{imageUrls[i]?<Image src={imageUrls[i]!} alt="" fill unoptimized sizes="64px"/>:<span aria-hidden="true">✦</span>}</span><span className={styles.identity}><strong>{card.title}</strong><small>{card.card_number?card.card_number+" · ":""}{card.set_name} · {card.category}{card.alternate_art_path?" · Alt art":""}</small></span><span className={styles.pill} data-status={card.status}>{card.status}</span><span className={styles.arrow}>→</span></Link>)}
      {!visible.length&&<div className={styles.empty}><span>✧</span><h3>No cards here yet.</h3><p>Create your first draft, or adjust your filters.</p><form action={createPodBoundCard}><button className={styles.primary}>Create a card</button></form></div>}</div>
    </section>
    <p className={styles.note}>Only you can manage this archive. Publishing a card stores its status; the public Card Gallery will be connected in the next phase.</p>
  </main>;
}
