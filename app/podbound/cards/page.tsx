import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { getPodBoundArtworkUrl, getPodBoundCards, type CardCategory } from "@/lib/podbound-cards";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import styles from "./gallery.module.css";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Card Catalogue | PodBound", description: "Explore officially revealed PodBound cards and original artwork from PodScape Labs." };
const categories: {value:"all"|CardCategory; label:string}[] = [
  {value:"all",label:"All Cards"}, {value:"species",label:"Species"}, {value:"environment",label:"Environments"},
  {value:"food",label:"Food"}, {value:"event",label:"Events"}, {value:"gameplay",label:"Gameplay"}
];
type Params={q?:string; category?:string; art?:string};

export default async function PodBoundCardGallery({searchParams}:{searchParams:Promise<Params>}) {
  const params=await searchParams;
  const category=categories.some(c=>c.value===params.category)?params.category||"all":"all";
  const query=(params.q||"").trim().slice(0,100);
  const all=(await getPodBoundCards()).filter(c=>c.status==="published");
  const filtered=all.filter(c=>(category==="all"||c.category===category)&&(!query||[c.title,c.set_name,c.card_number,c.category,c.summary].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  const cards=await Promise.all(filtered.map(async c=>({...c,artUrl:await getPodBoundArtworkUrl(c.core_art_path)})));
  const highlighted=cards.find(c=>c.featured&&c.artUrl)||cards.find(c=>c.artUrl);
  const isOwner=await isAdminAuthenticated();
  return <div className={styles.site}>
    <a className="skip-link" href="#catalogue">Skip to cards</a>
    <Header/>
    <main className={styles.main} id="catalogue">
      <nav className={styles.crumbs} aria-label="Back to PodBound"><Link href="/podbound">← PodBound</Link></nav>
      <header className={styles.header}>
        <p className={styles.kicker}>A PODSCAPE LABS ORIGINAL / FIELD ARCHIVE</p>
        <div className={styles.titleRow}><div><h1>Card Catalogue</h1><p>Meet the species, environments and artwork behind PodBound.</p></div><span className={styles.count}>{all.length} revealed {all.length===1?"card":"cards"}</span></div>
      </header>
      {highlighted&&<Link className={styles.feature} href={`/podbound/cards/${highlighted.id}`}>
        <div className={styles.featureArt}><Image src={highlighted.artUrl!} alt={highlighted.core_art_alt||highlighted.title} fill unoptimized sizes="(max-width:700px) 35vw, 350px"/></div>
        <div className={styles.featureText}><span>FEATURED REVEAL</span><h2>{highlighted.title}</h2><p>{highlighted.summary||"Explore the original artwork and story behind this card."}</p><strong>View card →</strong></div>
      </Link>}
      <section className={styles.library} aria-label="Browse card collection">
        <div className={styles.sectionHeading}><div><span className={styles.kicker}>THE COLLECTION</span><h2>Explore the cards</h2></div><Link href="/podbound">Back to PodBound →</Link></div>
        <nav className={styles.chips} aria-label="Card category">
          {categories.map(c=><Link key={c.value} href={`/podbound/cards?${new URLSearchParams({...query?{q:query}:{},...c.value!=="all"?{category:c.value}:{}})}`} className={category===c.value?styles.selected:""} aria-current={category===c.value?"page":undefined}>{c.label}</Link>)}
        </nav>
        <form action="/podbound/cards" className={styles.search}>
          {category!=="all"&&<input type="hidden" name="category" value={category}/>}
          <label className={styles.srOnly} htmlFor="card-search">Search card catalogue</label>
          <input id="card-search" name="q" type="search" placeholder="Search cards, sets or species…" defaultValue={query} maxLength={100}/>
          <button type="submit">Search</button>
          {(query||category!=="all")&&<Link href="/podbound/cards">Clear</Link>}
        </form>
        <p className={styles.results} role="status">Showing {cards.length} of {all.length} revealed cards</p>
        {cards.length?<div className={styles.grid}>
          {cards.map(c=><Link key={c.id} href={`/podbound/cards/${c.id}`} className={styles.card}>
            <div className={styles.art}>{c.artUrl?<Image src={c.artUrl} alt={c.core_art_alt||c.title} fill unoptimized sizes="(max-width:600px) 45vw, (max-width:900px) 30vw, 250px"/>:<span className={styles.artMissing}><PodscapeLineIcon name="podbound" />Artwork to be revealed</span>}</div>
            <div className={styles.cardInfo}><small>{c.category} · {c.set_name||"Core Set"}</small><strong>{c.title}</strong><span>{c.card_number||"PodBound"} <b aria-hidden="true">↗</b></span></div>
          </Link>)}
        </div>:<div className={styles.empty}><PodscapeLineIcon name="podbound" /><h3>{all.length?"No matching cards yet.":"The collection is taking shape."}</h3><p>{all.length?"Try a different search or browse all cards.":"Original artwork and card reveals will appear here as they're approved for publication."}</p>{all.length?<Link href="/podbound/cards">Browse all cards →</Link>:<Link href="/podbound">Explore PodBound →</Link>}</div>}
      </section>
      {isOwner&&<aside className={styles.owner}><span>OWNER ACCESS</span><p>Ready to reveal more cards? Publish them from the Card Desk.</p><Link href="/admin/podbound">Open Card Desk →</Link></aside>}
    </main>
  </div>;
}
