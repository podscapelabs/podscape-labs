export default function AdminLoading() {
  return (
    <main className="admin-shell admin-loading-shell">
      <section className="admin-loading-card" role="status" aria-live="polite">
        <span className="admin-loading-mark" aria-hidden="true" />
        <p className="eyebrow">Podscape Labs · Owner studio</p>
        <h1>Opening your desk…</h1>
        <p>Loading your latest saved records from the studio archive.</p>
        <div className="admin-loading-track" aria-hidden="true"><span /></div>
      </section>
    </main>
  );
}
