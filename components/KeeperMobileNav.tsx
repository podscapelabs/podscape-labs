import Link from "next/link";
import styles from "./KeeperMobileNav.module.css";

const items = [
  { href: "/admin/preview", icon: "⌂", label: "Home" },
  { href: "/ledger/my-collection", icon: "◇", label: "Collection" },
  { href: "/keeper/scan", icon: "▣", label: "Scan", primary: true },
  { href: "/ledger", icon: "▤", label: "Ledger" },
  { href: "/account", icon: "○", label: "Account" },
] as const;

export function KeeperMobileNav({ active }: { active: "collection" | "scan" | "keeper" }) {
  return <nav className={styles.nav} aria-label="Keeper navigation">
    {items.map((item) => { const isActive = active === item.label.toLowerCase() || (active === "keeper" && item.label === "Collection"); return <Link href={item.href} key={item.label} className={`${styles.item} ${"primary" in item && item.primary ? styles.primary : ""} ${isActive ? styles.active : ""}`}>
      <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
    </Link>; })}
  </nav>;
}
