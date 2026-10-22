"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PodscapeLineIcon, type PodscapeIconName } from "./PodscapeLineIcon";
import styles from "./KeeperMobileNav.module.css";

const items: { href: string; icon: PodscapeIconName; label: string; primary?: boolean }[] = [
  { href: "/admin/preview", icon: "leaf", label: "Explore" },
  { href: "/ledger", icon: "book", label: "Ledger" },
  { href: "/keeper/scan", icon: "scan", label: "Scan", primary: true },
  { href: "/keeper", icon: "manager", label: "Manager" },
  { href: "/menu", icon: "menu", label: "Menu" },
];

export function KeeperMobileNav({ active }: { active: "collection" | "scan" | "keeper" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<nav className={styles.nav} aria-label="Keeper navigation">
    {items.map((item) => { const isActive = active === item.label.toLowerCase() || (active === "collection" && item.label === "Ledger"); return <Link href={item.href} key={item.label} className={`${styles.item} ${item.primary ? styles.primary : ""} ${isActive ? styles.active : ""}`}>
      <span><PodscapeLineIcon name={item.icon} /></span><small>{item.label}</small>
    </Link>; })}
  </nav>, document.body);
}
