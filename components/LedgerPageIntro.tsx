import styles from "./LedgerLayout.module.css";

export function LedgerPageIntro({ mode }: { mode: "discover" | "collection" }) {
  const collection = mode === "collection";

  return <header className={styles.intro}>
    <div className={`v2-container ${styles.introInner}`}>
      <div className={styles.introCopy}>
        <p className={styles.eyebrow}>{collection ? "Podscape Labs / Keeper Archive" : "Podscape Labs / Species Archive"}</p>
        <h1 className={styles.title}>{collection ? "My Collection" : "Leaf Ledger"}</h1>
        <p className={styles.description}>{collection
          ? "Your personal species archive, kept private to your account."
          : "Explore the world of isopods. Discover species and build your personal collection."}</p>
      </div>
      <svg className={styles.introLeaf} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 34C7 17 20 8 40 7c2 19-7 33-22 33-5 0-8-2-10-6Z" strokeWidth="1.5"/>
        <path d="M10 39C17 28 26 20 37 12" strokeWidth="1.5"/>
        <path d="m21 26-2-10m9 4 8 1" strokeWidth="1"/>
      </svg>
    </div>
  </header>;
}
