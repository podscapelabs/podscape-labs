"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./reader.module.css";

type Section = { id: string; heading: string; body: string };
type Related = { slug: string; name: string; scientific: string };

function Body({ text }: { text: string }) {
  return <div className={styles.body}>{text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n").map(x => x.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(x => /^[-*•]\s+/.test(x))) return <ul key={i}>{lines.map((x,j)=><li key={j}>{x.replace(/^[-*•]\s+/, "")}</li>)}</ul>;
    if (lines.length > 1 && lines.every(x => x.includes(" | "))) return <div className={styles.references} key={i}>{lines.map((x,j)=>{const [name,...rest]=x.split(" | ");return <div key={j}><strong>{name}</strong><span>{rest.join(" · ")}</span></div>})}</div>;
    return <p key={i}>{block}</p>;
  })}</div>;
}

export default function GuideReader({title,summary,category,date,sections,caution,related}:{title:string;summary:string;category:string;date:string;sections:Section[];caution?:string;related:Related[]}) {
  const [index,setIndex] = useState(0);
  const [menu,setMenu] = useState(false);
  const current = sections[index];
  const change = (next:number) => {setIndex(next);setMenu(false);window.scrollTo({top:0,behavior:"smooth"});};
  return <article className={styles.page}><div className={styles.wrap}>
    <Link href="/field-guide" className={styles.back}>← Field Guide</Link>
    <header className={styles.hero}><span className={styles.kicker}>PODSCAPE FIELD GUIDE / {category}</span><h1>{title}</h1><p>{summary}</p><div className={styles.meta}><span>Updated {date}</span><span>{sections.length} chapters</span></div></header>
    {sections.length ? <>
      <div className={styles.reader}>
        <div className={styles.chapterBar}><span>CHAPTER {String(index+1).padStart(2,"0")} / {String(sections.length).padStart(2,"0")}</span><button type="button" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="guide-chapters">Chapters <span aria-hidden="true">{menu?"−":"⌄"}</span></button></div>
        <div className={styles.progress}><div style={{width:`${(index+1)/sections.length*100}%`}} /></div>
        {menu ? <nav id="guide-chapters" className={styles.chapters} aria-label="Guide chapters">{sections.map((s,i)=><button type="button" key={s.id} aria-current={i===index?"step":undefined} onClick={()=>change(i)}><span>{String(i+1).padStart(2,"0")}</span>{s.heading}</button>)}</nav>:null}
        <section className={styles.chapter} aria-live="polite"><span className={styles.chapterLabel}>SECTION {String(index+1).padStart(2,"0")}</span><h2>{current.heading}</h2>{index===0&&caution?<aside className={styles.note}><strong>FIELD NOTE</strong><p>{caution}</p></aside>:null}<Body text={current.body}/></section>
        <div className={styles.controls}><button type="button" onClick={()=>change(index-1)} disabled={index===0}>← Previous</button>{index<sections.length-1?<button type="button" className={styles.next} onClick={()=>change(index+1)}>Next chapter →</button>:<Link className={styles.next} href="/field-guide">All guides →</Link>}</div>
      </div>
    </>:<p>This guide is awaiting its first chapter.</p>}
    {related.length ? <div className={styles.related}><strong>RELATED SPECIES</strong>{related.map(r=><Link key={r.slug} href={`/ledger/${r.slug}`}>{r.name} <span>{r.scientific} →</span></Link>)}</div>:null}
    <Link href="/field-guide" className={styles.end}>← Browse all field guides</Link>
  </div></article>;
}
