import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getPodBoundCard, getPodBoundArtworkUrl } from "@/lib/podbound-cards";
import { getSpeciesRecords } from "@/lib/species-store";
import styles from "./detail.module.css";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";

export const dynamic = "force-dynamic";
export default async function CardDetail({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
  const card=await getPodBoundCard(id);
  if(!card||card.status!=="published")notFound();
  const [core,alt]=await Promise.all([getPodBoundArtworkUrl(card.core_art_path),getPodBoundArtworkUrl(card.alternate_art_path)]);
  let speciesUrl:string|null=null;
  if(card.species_record_id){
    const records=await getSpeciesRecords();
    const related=records.find(c=>c.id===card.species_record_id&&c.status==="published");
    speciesUrl=related?"/ledger/"+related.slug:null;
  }
  return <div className={styles.site}>
    <Header/>
    <main className={styles.main}>
      <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/podbound">PodBound</Link><span>/</span><Link href="/podbound/cards">Card Catalogue</Link><span>/</span><span>{card.title}</span></nav>
      <Link className={styles.back} href="/podbound/cards">← Back to Card Catalogue</Link>
      <header className={styles.header}><p>A PODSCAPE LABS ORIGINAL / CARD ARCHIVE</p><h1>{card.title}</h1><span>{card.category} · {card.set_name||"Core Set"}{card.card_number?" · "+card.card_number:""}</span></header>
      <div className={styles.layout}>
        <section className={styles.artworks} aria-label="Original card artwork">
          <div className={styles.art}>{core?<Image src={core} alt={card.core_art_alt||card.title+" original artwork"} fill unoptimized sizes="(max-width:700px) 90vw, 450px"/>:<div className={styles.placeholder}><PodscapeLineIcon name="podbound" /><p>Artwork reveal pending</p></div>}</div>
          {alt&&<div className={styles.alternate}><p>ALTERNATE ARTWORK</p><div className={styles.altArt}><Image src={alt} alt={card.alternate_art_alt||card.title+" alternate artwork"} fill unoptimized sizes="(max-width:700px) 90vw, 450px"/></div></div>}
        </section>
        <section className={styles.story}>
          <p className={styles.eyebrow}>BEHIND THE CARD</p><h2>The story behind the art.</h2>
          <p>{card.summary||"Discover the original artwork behind this PodBound card. More stories from the studio will be shared as the collection grows."}</p>
          {card.artist_name&&<div className={styles.meta}><span>ARTIST</span><strong>{card.artist_name}</strong></div>}
          {card.set_name&&<div className={styles.meta}><span>COLLECTION</span><strong>{card.set_name}</strong></div>}
          {speciesUrl&&<Link className={styles.ledger} href={speciesUrl}><span><small>FROM THE LEAF LEDGER</small><strong>Meet the real species</strong></span><b aria-hidden="true">↗</b></Link>}
          <p className={styles.note}>PodBound is in development. Gameplay information will be published when its rules are ready.</p>
        </section>
      </div>
      <Link className={styles.last} href="/podbound/cards">← Explore more PodBound cards</Link>
    </main>
  </div>;
}
