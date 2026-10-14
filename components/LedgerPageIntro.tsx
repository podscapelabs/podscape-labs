import styles from "./LedgerWorkspace.module.css";

export function LedgerPageIntro({ view = "discover" }: { view?: "discover" | "collection" }) {
  return <header className={styles.hero}>
    <div className={`v2-container ${styles.heroInner}`}>
      <div className={styles.heroKicker}>
        <span>Podscape Labs / Species archive</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.3 3.7C11.6 3.2 5.7 5.7 4 11.2c-1.1 3.5.5 7.3 4.7 8 12.2-5.9 11.6-15.5Z" />
          <path d="M5.7 18.2c2.9-3.7 6.5-6.4 10.7-8.4" />
        </svg>
      </div>
      <h1>Leaf Ledger</h1>
      <p>{view === "collection"
        ? "Your private collection of isopods, organized in one personal archive."
        : "Explore isopod species and build your personal collection."}</p>
    </div>
  </header>;
}
