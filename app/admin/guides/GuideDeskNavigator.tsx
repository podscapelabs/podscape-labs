"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PodscapeLineIcon } from "@/components/PodscapeLineIcon";
import styles from "./guide-desk.module.css";

type GuideItem = { id: string; title: string; summary: string; category: string; status: string; archived: boolean };
type Props = { records: GuideItem[]; selectedId?: string; archivedView: boolean };

export function GuideDeskNavigator({ records, selectedId, archivedView }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(records.map(item => item.category).filter(Boolean))].sort(), [records]);
  const visible = useMemo(() => records.filter(item =>
    (category === "all" || item.category === category) &&
    [item.title, item.summary, item.category, item.status].some(value => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  ), [records, category, query]);
  return <div className={styles.recordFinder}>
    <div className={styles.searchField}>
      <PodscapeLineIcon name="search" />
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a guide…" aria-label="Search guide records" />
    </div>
    <div className={styles.categoryRow} role="group" aria-label="Filter guides by category">
      <button type="button" className={category === "all" ? styles.activeCategory : ""} onClick={() => setCategory("all")} aria-pressed={category === "all"}>All</button>
      {categories.map(value => <button type="button" key={value} onClick={() => setCategory(value)} className={category === value ? styles.activeCategory : ""} aria-pressed={category === value}>{value}</button>)}
    </div>
    <div className={styles.resultsMeta} aria-live="polite">{visible.length} {visible.length === 1 ? "guide" : "guides"}</div>
    <nav className={styles.recordNav} aria-label="Guide records">
      {visible.map(item => <Link key={item.id} href={`/admin/guides?view=${archivedView ? "archived" : "active"}&record=${encodeURIComponent(item.id)}`} className={item.id === selectedId ? styles.activeRecord : styles.record} aria-current={item.id === selectedId ? "page" : undefined}>
        <span className={styles.recordTop}><span>{item.category}</span><span className={styles.recordState}>{item.archived ? "Archived" : item.status}</span></span>
        <strong>{item.title || "Untitled guide"}</strong>
        <small>{item.summary || "No summary yet"}</small>
      </Link>)}
      {visible.length === 0 && <p className={styles.emptyResults}>No matching guides. Try another search or category.</p>}
    </nav>
  </div>;
}
