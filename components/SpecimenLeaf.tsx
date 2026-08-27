import Image from "next/image";

type SpecimenLeafProps = {
  image?: string | null;
  alt?: string;
  number?: string;
  size?: "hero" | "card" | "profile";
  positionX?: number;
  positionY?: number;
  zoom?: number;
};

export function SpecimenLeaf({ image, alt = "", number, size = "card", positionX = 50, positionY = 50, zoom = 1 }: SpecimenLeafProps) {
  return (
    <div className={`specimen-leaf specimen-leaf-${size}`}>
      <span className="specimen-leaf-outline" aria-hidden="true" />
      <span className="specimen-leaf-vein" aria-hidden="true" />
      <span className="specimen-photo">
        {image ? (
          <Image src={image} alt={alt} fill sizes={size === "hero" ? "(min-width: 960px) 34vw, 78vw" : "220px"} style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }} />
        ) : (
          <span className="specimen-photo-placeholder" aria-label="Species photograph pending">
            <span>Photo</span>
            <small>pending</small>
          </span>
        )}
      </span>
      {number ? <span className="specimen-catalogue-number">{number}</span> : null}
    </div>
  );
}
