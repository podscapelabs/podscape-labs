import Link from "next/link";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return <div className="v2-site"><a className="skip-link" href="#platform-main">Skip to content</a><Header /><main id="platform-main">{children}</main><Footer /></div>;
}

export function PlatformPageHeader({ eyebrow, title, intro, index }: { eyebrow: string; title: string; intro: string; index?: string }) {
  return <header className="v2-page-header"><div className="v2-container v2-page-header-grid"><div><p className="v2-label">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div>{index ? <aside><span>Archive Plate</span><strong>{index}</strong><small>Podscape Labs · Ontario</small></aside> : null}</div></header>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="v2-breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label}>{index ? <i aria-hidden="true">/</i> : null}{item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}</span>)}</nav>;
}
