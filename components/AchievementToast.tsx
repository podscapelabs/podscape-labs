"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import styles from "./AchievementToast.module.css";

export type AchievementNotice = { id: string; title: string; description: string; exp: number; coins: number; hidden?:boolean };
const EVENT = "podscape:achievement-unlocked";

export function announceAchievement(notice: AchievementNotice) {
  window.dispatchEvent(new CustomEvent<AchievementNotice>(EVENT, { detail: notice }));
}

export function AchievementToast() {
  const [queue, setQueue] = useState<AchievementNotice[]>([]);
  const current = queue[0];
  useEffect(() => {
    const receive = (event: Event) => {
      const notice = (event as CustomEvent<AchievementNotice>).detail;
      if (!notice || typeof notice.id !== "string") return;
      setQueue(prev => prev.some(item => item.id === notice.id) ? prev : [...prev, notice]);
    };
    window.addEventListener(EVENT, receive);
    return () => window.removeEventListener(EVENT, receive);
  }, []);
  useEffect(() => {
    if (!current) return;
    const timeout = window.setTimeout(() => setQueue(prev => prev.slice(1)), 5500);
    return () => window.clearTimeout(timeout);
  }, [current?.id]);
  const dismiss = () => setQueue(prev => prev.slice(1));
  if (!current) return null;
  return createPortal(<aside className={styles.toast} data-hidden={current.hidden===true?"true":undefined} role="status" aria-live="polite" aria-atomic="true">
    <div className={styles.icon} aria-hidden="true">{current.hidden?"✺":"✦"}</div>
    <div className={styles.content}>
      <div className={styles.eyebrow}>{current.hidden?"Hidden Achievement Discovered!":"Achievement unlocked!"}</div>
      <strong>{current.title}</strong>
      <div className={styles.description}>{current.description}</div>
      <div className={styles.rewards}>+{current.exp} EXP{current.coins>0?<><span aria-hidden="true">·</span> +{current.coins} Pod Coins</>:null}</div>
      <Link className={styles.link} href="/account/progress" onClick={dismiss}>View achievements →</Link>
    </div>
    <button className={styles.close} type="button" aria-label="Dismiss achievement" onClick={dismiss}>×</button>
  </aside>, document.body);
}
