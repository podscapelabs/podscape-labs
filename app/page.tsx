import Image from "next/image";

export default function Home() {
  return (
    <main className="maintenance-page">
      <a className="skip-link" href="#maintenance-message">Skip to update notice</a>

      <section className="maintenance-shell" aria-labelledby="maintenance-title">
        <header className="maintenance-header">
          <Image
            className="maintenance-wordmark"
            src="/assets/logos/podscape-wordmark.svg"
            alt="Podscape Labs"
            width={480}
            height={120}
            priority
          />
          <p className="maintenance-status"><span aria-hidden="true" />Site update in progress</p>
        </header>

        <div className="maintenance-grid" id="maintenance-message">
          <div className="maintenance-copy">
            <p className="maintenance-index">PL / Website notice</p>
            <h1 id="maintenance-title">The lab is being prepared.</h1>
            <p className="maintenance-intro">
              We&apos;re making updates to podscapelabs.com. The website will return soon.
            </p>

            <div className="maintenance-actions">
              <a className="button button-primary" href="https://www.podbound.net">
                Visit PodBound <span aria-hidden="true">↗</span>
              </a>
              <a className="maintenance-contact" href="mailto:podscapelabs@gmail.com">
                Contact the lab
              </a>
            </div>
          </div>

          <div className="maintenance-record" aria-hidden="true">
            <span className="maintenance-record-number">01</span>
            <div className="maintenance-record-mark">
              <span />
              <span />
              <span />
            </div>
            <p>Collect. Care. Explore.</p>
          </div>
        </div>

        <footer className="maintenance-footer">
          <p>Podscape Labs</p>
          <p>Ontario, Canada</p>
          <p>© 2026</p>
        </footer>
      </section>
    </main>
  );
}
