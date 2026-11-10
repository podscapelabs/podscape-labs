"use client";

import Link from "next/link";
import { PodscapeLineIcon } from "./PodscapeLineIcon";
import { useOnlinePresence } from "./OnlinePresenceProvider";
import styles from "./OnlineNow.module.css";

export function OnlineNow({ variant = "panel" }: { variant?: "panel" | "compact" }) {
  const { status, count } = useOnlinePresence();
  const ready = status === "connected";
  return <section className={variant === "compact" ? styles.compact : styles.panel} aria-label="PodScape online presence" aria-live="polite" aria-atomic="true">
    <div className={styles.icon}><PodscapeLineIcon name="community"/></div>
    <div className={styles.copy}>
      <span className={styles.eyebrow}><span className={ready ? styles.dot : styles.dotMuted}/> {ready ? "LIVE COMMUNITY" : "COMMUNITY STATUS"}</span>
      <strong>{ready ? count.toLocaleString("en-CA") : "—"} <span>{ready ? "online now" : "Online Now"}</span></strong>
      <p>{ready ? "Active PodScape sessions right now. One person may have more than one tab open." : status === "unavailable" ? "Live presence isn't available right now." : "Connecting to the live community…"}</p>
    </div>
    {variant === "compact" ? <Link href="/community" className={styles.open} aria-label="Explore PodScape Community">Explore <PodscapeLineIcon name="arrow-right"/></Link> : null}
  </section>;
}
