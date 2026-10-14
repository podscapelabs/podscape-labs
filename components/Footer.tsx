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
          <nav className={styles.links} aria-label="Footer navigation">
            <Link href="/ledger">Leaf Ledger</Link>
            <Link href="/field-guide">Field Guide</Link>
            <a href="https://www.podbound.net" target="_blank" rel="noopener noreferrer">PodBound</a>
            <Link href="/from-the-lab">From the Lab</Link>
            <Link href="/explore#about">About</Link>
          </nav>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Podscape Labs</span>
          <span>Ontario, Canada</span>
        </div>
      </div>
    </footer>
  );
}
