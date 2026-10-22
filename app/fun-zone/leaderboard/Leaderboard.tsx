"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./leaderboard.module.css";
export default function Leaderboard(){
 const [period,setPeriod]=useState<"Weekly"|"Monthly"|"All-time">("Weekly");
 return <main className={styles.page}><div className={styles.wrap}><Link href="/fun-zone" className={styles.back}>← Fun Zone</Link><p className={styles.eyebrow}>FUN ZONE / COMMUNITY</p><h1>Leaderboard ✧</h1><p>Earn Fun Zone EXP by completing puzzles and challenges. Harder activities can earn more points.</p><div className={styles.tabs} role="group" aria-label="Leaderboard period">{(["Weekly","Monthly","All-time"] as const).map(t=><button type="button" key={t} aria-pressed={period===t} className={period===t?styles.active:""} onClick={()=>setPeriod(t)}>{t}</button>)}</div><section className={styles.empty}><span aria-hidden="true">✧</span><h2>{period} rankings</h2><p>Rankings will appear once Fun Zone puzzle scores and opt-in profiles are connected. No sample players or made-up scores.</p><Link href="/fun-zone/word-search">Try Genus Explorer →</Link></section><p className={styles.note}>Only Fun Zone EXP will count. Purchases and Pod Coins never affect rankings. Public participation will be optional.</p></div></main>;
}