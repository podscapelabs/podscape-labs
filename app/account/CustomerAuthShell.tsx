import Link from "next/link";
import styles from "./customer-auth.module.css";

export function CustomerAuthShell({
  index, eyebrow, title, intro, children,
}: {
  index: string; eyebrow: string; title: string; intro: string; children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/admin/preview">Podscape Labs</Link><span aria-hidden="true">/</span><Link href="/account">Account</Link>
        </nav>
        <div className={styles.grid}>
          <section className={styles.intro}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p>{intro}</p>
            <div className={styles.plate}><span>FIELD RECORD</span><strong>{index}</strong><small>Podscape Labs · Member access</small></div>
          </section>
          <section className={styles.panel} aria-label={title}>{children}</section>
        </div>
      </div>
    </div>
  );
}
