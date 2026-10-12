import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPageHeader, PlatformShell } from "@/components/PlatformShell";
import { isLabRecordActive, labRecordDate } from "@/data/lab";
import { labBench } from "@/data/platform";
import { getLabRecords } from "@/lib/lab-store";

export const metadata: Metadata = { title: "From the Lab | Podscape Labs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LabPage() {
  const records = (await getLabRecords())
    .filter(isLabRecordActive)
    .sort((a, b) => Date.parse(b.publishedAt || b.updatedAt) - Date.parse(a.publishedAt || a.updatedAt));

  return <PlatformShell><PlatformPageHeader eyebrow="Studio notebook" title="From the Lab" intro="See what we're testing, building, and learning across the Podscape ecosystem." index="LAB / 001" /><section className="v2-page-section"><div className="v2-container"><div className="v2-lab-page-grid"><div><p className="v2-kicker">On the bench</p>{labBench.map((item) => <article key={item.area}><span>{item.status}</span><h2>{item.area}</h2><p>{item.detail}</p></article>)}</div><div><p className="v2-kicker">Studio journal</p>{records.map((record) => <Link href={`/from-the-lab/${record.slug}`} key={record.id}><span>{record.category} · {record.status === "draft" ? "Studio draft" : labRecordDate(record)}</span><h2>{record.title}</h2><p>{record.summary || "Summary pending."}</p><small>Open studio note →</small></Link>)}{!records.length ? <div className="v2-lab-empty"><h2>The notebook is ready.</h2><p>Create the first studio note in the owner studio when there is something worth recording.</p><Link href="/admin/lab">Open the notebook desk →</Link></div> : null}</div></div></div></section></PlatformShell>;
}
