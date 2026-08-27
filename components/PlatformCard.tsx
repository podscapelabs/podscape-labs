import Link from "next/link";
import { ArrowUpRightIcon } from "./Icons";

type PlatformCardProps = {
  destination: {
    key: string;
    index: string;
    name: string;
    eyebrow: string;
    description: string;
    href: string;
    cta: string;
  };
};

export function PlatformCard({ destination }: PlatformCardProps) {
  const external = destination.href.startsWith("http");
  const body = (
    <>
      <div className="platform-card-topline">
        <span>{destination.index}</span>
        <span>{destination.eyebrow}</span>
      </div>
      <div className="platform-card-mark" aria-hidden="true"><span /></div>
      <div className="platform-card-copy">
        <h3>{destination.name}</h3>
        <p>{destination.description}</p>
        <span className="platform-card-link">{destination.cta}<ArrowUpRightIcon /></span>
      </div>
    </>
  );

  return external ? (
    <a className={`platform-card platform-card-${destination.key}`} href={destination.href} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <Link className={`platform-card platform-card-${destination.key}`} href={destination.href}>
      {body}
    </Link>
  );
}
