"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./fun-zone.module.css";
export function FunZoneCarousel({signedIn,exp,coins}:{signedIn:boolean;exp:number;coins:number}){
 const [slide,setSlide]=useState(0);
 const titles=["Daily Pod Wheel","My Fun Zone Profile","The Leaderboard"];
 return <section className={styles.carousel} aria-label="Fun Zone highlights">
 <div className={styles.carouselSlides}>
 {slide===0?<div className={styles.carouselContent}><div><p className={styles.eyebrow}>DAILY REWARD · COMING SOON</p><h2>The Daily Pod Wheel</h2><p>One free daily spin for members. Rewards are on the way.</p><span className={styles.pill}>Wheel opening soon</span></div><div className={styles.wheelGraphic} aria-hidden="true"><div className={styles.wheelCenter}>✦</div></div></div>:null}
 {slide===1?<div className={styles.carouselContent}><div><p className={styles.eyebrow}>YOUR FUN ZONE</p><h2>My Play Profile</h2><p>{signedIn?"Your activity, achievements, and puzzle progress will live here.":"Sign in to track your puzzles and future rewards."}</p><Link className={styles.pill} href={signedIn?"/account/progress":"/account/login"}>{signedIn?"View my progress →":"Sign in →"}</Link></div><div className={styles.profileStats}><strong>{signedIn?exp.toLocaleString("en-CA"):"—"} <small>Lifetime EXP</small></strong><strong>{signedIn?coins.toLocaleString("en-CA"):"—"} <small>Pod Coins</small></strong><span>Fun Zone EXP tracking coming soon</span></div></div>:null}
 {slide===2?<div className={styles.carouselContent}><div><p className={styles.eyebrow}>COMMUNITY · COMING SOON</p><h2>The Leaderboard</h2><p>Weekly, monthly, and all-time rankings based on Fun Zone EXP. No purchases, no paid advantage.</p><Link className={styles.pill} href="/fun-zone/leaderboard">Explore leaderboard →</Link></div><div className={styles.trophy} aria-hidden="true">✧<span>1 · 2 · 3</span></div></div>:null}
 </div>
 <div className={styles.carouselControls}><button type="button" onClick={()=>setSlide(i=>(i+2)%3)} aria-label="Previous highlight">‹</button><div className={styles.carouselDots}>{titles.map((title,i)=><button type="button" key={title} className={i===slide?styles.dotActive:""} onClick={()=>setSlide(i)} aria-label={title} aria-current={i===slide?"true":undefined}/>)}</div><button type="button" onClick={()=>setSlide(i=>(i+1)%3)} aria-label="Next highlight">›</button></div>
 </section>;
}