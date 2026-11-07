"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./fun-zone.module.css";
const slides = [
 {eyebrow:"FEATURED GAME",title:"Word Search",description:"Find hidden isopod terms in a botanical word puzzle.",href:"/fun-zone/word-search",action:"Play now →",status:"Ready to play"},
 {eyebrow:"FEATURED · LOGIC",title:"Colony Connections",description:"Sixteen isopod terms. Four hidden connections. Can you find them all?",href:"/fun-zone/colony-connections",action:"Play now →",status:"Ready to play"},
 {eyebrow:"FEATURED · QUIZ",title:"Species Detective",description:"Put your species knowledge to the test with clues and identification puzzles.",href:"/fun-zone/species-detective",action:"Play now →",status:"Ready to play"}
] as const;
export function FunZoneCarousel({signedIn,exp,coins}:{signedIn:boolean;exp:number;coins:number}){
 void signedIn; void exp; void coins;
 const [slide,setSlide]=useState(0);
 const current=slides[slide];
 return <section className={styles.carousel} aria-label="Fun Zone featured puzzles">
   <div className={styles.carouselContent}>
    <div className={styles.featureCopy}><p className={styles.featureEyebrow}>{current.eyebrow}</p><h2>{current.title}</h2><p>{current.description}</p>
    <Link className={styles.playLink} href={current.href}>{current.action}</Link></div>
    <div className={styles.featureArtwork} aria-hidden="true"><span>❧</span><span>{slide===0?"⌗":slide===1?"◇":"⌕"}</span></div>
   </div>
   <div className={styles.featureFoot}><span>{current.status}</span><div className={styles.carouselDots}>{slides.map((s,i)=><button type="button" aria-label={`Show ${s.title}`} aria-current={slide===i?"true":undefined} key={s.title} onClick={()=>setSlide(i)} />)}</div><button className={styles.carouselNext} type="button" aria-label="Next featured puzzle" onClick={()=>setSlide(i=>(i+1)%slides.length)}>→</button></div>
  </section>;
}
