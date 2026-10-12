import Link from "next/link";
import styles from "./CollectionControls.module.css";

export function LedgerCollectionTabs({ active, signedIn }: { active: "discover" | "collection"; signedIn: boolean }) {
  return <nav className={styles.tabs} aria-label="Leaf Ledger views">
    <Link className={styles.tab} href="/ledger" aria-current={active === "discover" ? "page" : undefined}>Discover</Link>
    <Link className={styles.tab} href={signedIn ? "/ledger/my-collection" : "/account/login"} aria-current={active === "collection" ? "page" : undefined}>My Collection</Link>
  </nav>;
}
