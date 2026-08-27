import Link from "next/link";
import { ArrowUpRightIcon } from "./Icons";
import type { LabNote } from "@/content/site";

export function ArticleCard({ note, index }: { note: LabNote; index: number }) {
  const external = note.href.startsWith("http");
  const body = (
    <>
      <div className="article-card-meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{note.category}</span></div>
      <div className="article-card-field" aria-hidden="true"><span /></div>
      <div className="article-card-copy">
        <time>{note.date}</time>
        <h3>{note.title}</h3>
        <p>{note.summary}</p>
        <span className="article-card-link">Read note<ArrowUpRightIcon /></span>
      </div>
    </>
  );

  return external ? (
    <a className="article-card" href={note.href} target="_blank" rel="noreferrer">{body}</a>
  ) : (
    <Link className="article-card" href={note.href}>{body}</Link>
  );
}
