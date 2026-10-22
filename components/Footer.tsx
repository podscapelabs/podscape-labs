import Link from "next/link";
import styles from "./Footer.module.css";

/**
 * A deliberately quiet, navigation-first studio footer.
 * Unreleased platform areas and an unconnected email signup do not appear here.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`v2-container ${styles.inner}`}>
        <div className={styles.main}>
          <div className={styles.identity}>
            <strong>Podscape Labs</strong>
            <p>Games, tools, and resources for the isopod hobby.</p>
          </div>
          <nav className={styles.links} aria-label="Legal and contact"><Link href="/explore#about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Podscape Labs</span>
          <span>Ontario, Canada</span>
        </div>
      </div>
    </footer>
  );
}
