"use client";
import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { speciesDisplayName, speciesScientificName, type SpeciesRecord } from "@/data/species";
import type { GuideRecord } from "@/data/guides";
import type { LabRecord } from "@/data/lab";
import { formatProductPrice, type ProductRecord } from "@/data/products";
import { platformAreas } from "@/data/platform";

type SearchRecord = { id: string; type: string; title: string; subtitle: string; keywords: string[]; href: string };

export function UniversalSearch({ speciesRecords, guideRecords, productRecords, labRecords }: { speciesRecords: SpeciesRecord[]; guideRecords: GuideRecord[]; productRecords: ProductRecord[]; labRecords: LabRecord[] }) {
  const records: SearchRecord[] = useMemo(() => [
    ...speciesRecords.map((item) => ({ id: item.id, type: "Species · Leaf Ledger", title: speciesDisplayName(item), subtitle: speciesScientificName(item), keywords: [item.genus, item.species, item.morph, item.catalogueNumber, ...item.tags], href: `/ledger/${item.slug}` })),
    ...guideRecords.map((item) => ({ id: item.id, type: "Guide · Field Guide", title: item.title, subtitle: item.summary, keywords: [item.category], href: `/field-guide/${item.slug}` })),
    ...productRecords.map((item) => ({ id: item.id, type: "Product · Shop", title: item.title, subtitle: `${item.summary} · ${formatProductPrice(item)}`, keywords: [item.category, ...item.tags], href: `/shop/${item.slug}` })),
    ...labRecords.map((item) => ({ id: item.id, type: "Update · From the Lab", title: item.title, subtitle: item.summary, keywords: [item.category, ...item.tags], href: `/from-the-lab/${item.slug}` })),
    ...platformAreas.map((item) => ({ id: item.key, type: "Platform area", title: item.title, subtitle: item.description, keywords: [item.key], href: item.href })),
  ], [guideRecords, labRecords, productRecords, speciesRecords]);
  const [query, setQuery] = useState(""); const deferred = useDeferredValue(query.trim().toLowerCase());
  const results = useMemo(() => deferred ? records.filter((item) => `${item.title} ${item.subtitle} ${item.keywords.join(" ")}`.toLowerCase().includes(deferred)) : records.slice(0, 7), [deferred, records]);
  return <section className="v2-search-page"><label htmlFor="universal-search">Search Podscape</label><input id="universal-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Species, guides, products, projects, and updates" autoFocus /><p aria-live="polite">{deferred ? `${results.length} results` : "Browse the search index"}</p><div>{results.map((item) => item.href.startsWith("http") ? <a href={item.href} target="_blank" rel="noreferrer" key={`${item.type}-${item.id}`}><span>{item.type}</span><strong>{item.title}</strong><p>{item.subtitle}</p><small>Open →</small></a> : <Link href={item.href} key={`${item.type}-${item.id}`}><span>{item.type}</span><strong>{item.title}</strong><p>{item.subtitle}</p><small>Open →</small></Link>)}</div>{deferred && !results.length ? <div className="v2-empty-state"><h2>No Podscape records match that search.</h2><button type="button" onClick={() => setQuery("")}>Clear search</button></div> : null}</section>;
}
