import Image from "next/image";

type SpecimenLeafProps = {
  image?: string | null;
  alt?: string;
  number?: string;
  size?: "hero" | "card" | "profile";
};

export function SpecimenLeaf({ image, alt = "", number, size = "card" }: SpecimenLeafProps) {
  return (
    <div className={`specimen-leaf specimen-leaf-${size}`}>
      <span className="specimen-leaf-outline" aria-hidden="true" />
      <span className="specimen-leaf-vein" aria-hidden="true" />
      <span className="specimen-photo">
        {image ? (
          <Image src={image} alt={alt} fill sizes={size === "hero" ? "(min-width: 960px) 34vw, 78vw" : "220px"} />
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
