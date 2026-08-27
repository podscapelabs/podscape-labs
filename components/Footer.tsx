import Link from "next/link";

const groups = [
  { title: "Explore", links: [["Leaf Ledger", "/ledger"], ["Field Guide", "/field-guide"], ["Creative Network", "/explore#creative-network"], ["Vendor Directory", "/explore#vendor-directory"]] },
  { title: "Projects", links: [["PodBound", "https://www.podbound.net"], ["From the Lab", "/from-the-lab"]] },
  { title: "Studio", links: [["About", "/explore#about"], ["Studio Notes", "/from-the-lab"], ["Press Kit", "/explore#press"]] },
  { title: "Support", links: [["FAQ", "/explore#support"], ["Contact", "/explore#contact"], ["Shipping & Returns", "/explore#support"]] },
] as const;

export function Footer() {
  return (
    <footer className="v2-footer">
      <div className="v2-container v2-footer-top">
        <div className="v2-footer-studio">
          <p className="v2-kicker">About Podscape Labs</p>
          <h2>Useful things, built with care.</h2>
          <p>Podscape Labs is an independent studio in Ontario, Canada creating tools, games, projects, and resources for the isopod hobby.</p>
          <span>Ontario, Canada</span>
        </div>
        <form className="v2-newsletter">
          <p className="v2-kicker">Stay in the Loop</p>
          <h2>New projects, species, resources, and studio updates.</h2>
          <label htmlFor="newsletter-email">Email address</label>
          <div><input id="newsletter-email" type="email" placeholder="you@example.com" /><button type="button">Subscribe</button></div>
          <small>Preview only — subscriptions are not connected yet.</small>
        </form>
      </div>
      <div className="v2-footer-bottom">
        <div className="v2-container v2-footer-grid">
          <div className="v2-footer-identity"><b>Podscape Labs</b><span>© 2026 · All rights reserved.</span></div>
          {groups.map((group) => (
            <div className="v2-footer-links" key={group.title}>
              <b>{group.title}</b>
              {group.links.map(([label, href]) => href.startsWith("http") ? <a href={href} target="_blank" rel="noreferrer" key={label}>{label}</a> : <Link href={href} key={label}>{label}</Link>)}
            </div>
          ))}
          <div className="v2-footer-seal" aria-hidden="true"><span>PL</span><small>Field Archive</small></div>
        </div>
      </div>
    </footer>
  );
}
