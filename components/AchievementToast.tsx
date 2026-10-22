"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import styles from "./AchievementToast.module.css";

export type AchievementNotice = { id: string; title: string; description: string; exp: number; coins: number };
const EVENT = "podscape:achievement-unlocked";

export function announceAchievement(notice: AchievementNotice) {
  window.dispatchEvent(new CustomEvent<AchievementNotice>(EVENT, { detail: notice }));
}

export function AchievementToast() {
  const [queue, setQueue] = useState<AchievementNotice[]>([]);
  const [dismissed, setDismissed] = useState(false);
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
    const timeout = window.setTimeout(() => setDismissed(true), 5500);
    return () => window.clearTimeout(timeout);
  }, [current]);
  useEffect(() => {
    if (!dismissed) return;
    setQueue(prev => prev.slice(1));
    setDismissed(false);
  }, [dismissed]);
  if (!current) return null;
  return createPortal(<aside className={styles.toast} role="status" aria-live="polite" aria-atomic="true">
    <div className={styles.icon} aria-hidden="true">✦</div>
    <div className={styles.content}>
      <div className={styles.eyebrow}>Achievement unlocked!</div>
      <strong>{current.title}</strong>
      <div className={styles.description}>{current.description}</div>
      <div className={styles.rewards}>+{current.exp} EXP <span aria-hidden="true">·</span> +{current.coins} Pod Coins</div>
      <Link className={styles.link} href="/account/progress" onClick={() => setDismissed(true)}>View achievements →</Link>
    </div>
    <button className={styles.close} type="button" aria-label="Dismiss achievement" onClick={() => setDismissed(true)}>×</button>
  </aside>, document.body);
}
