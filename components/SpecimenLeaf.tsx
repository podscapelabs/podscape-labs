import Image from "next/image";

/* One shared botanical silhouette is used for both ownership states.
   The brown drawing and the green revival therefore align exactly. */
const organicShape = "M39 266 C32 245 42 217 60 199 C77 177 103 159 133 142 C145 131 146 118 165 112 C186 106 193 89 214 86 C234 80 246 81 261 73 C280 65 307 72 328 65 C349 58 374 57 396 61 C415 65 437 54 455 56 C493 51 527 56 562 48 C560 87 544 121 527 144 C511 163 484 178 462 190 C450 202 433 214 414 226 C397 237 380 237 358 248 C328 269 296 280 262 287 C226 298 198 292 174 301 C130 308 90 291 64 281 C52 277 43 271 39 266 Z";
const organicInner = "M90 254 C102 212 150 166 202 141 C291 94 395 95 514 75 C482 154 399 208 320 238 C233 278 156 279 90 254 Z";
const organicVein = "M18 281 C117 251 212 221 295 183 S457 108 555 56";
const organicBranches = "M157 235 Q146 201 155 157 M253 202 Q248 168 270 112 M341 158 Q350 120 389 75 M195 225 Q235 255 282 276 M312 178 Q356 209 402 220";

function OrganicLeafArtwork({ revivable }: { revivable: boolean }) {
  return <svg className="specimen-organic-leaf" viewBox="0 0 600 350" aria-hidden="true" focusable="false">
    <g className="specimen-organic-base">
      <path className="specimen-organic-shape" d={organicShape} />
      <path className="specimen-organic-inner" d={organicInner} />
      <path className="specimen-organic-vein" d={organicVein} />
      <path className="specimen-organic-branches" d={organicBranches} />
    </g>
    {revivable ? <>
      <g className="specimen-organic-revival-outline">
        <path className="specimen-organic-shape" d={organicShape} />
        <path className="specimen-organic-inner" d={organicInner} />
      </g>
      <g className="specimen-organic-revival-veins">
        <path className="specimen-organic-vein" d={organicVein} />
        <path className="specimen-organic-branches" d={organicBranches} />
      </g>
    </> : null}
  </svg>;
}


type SpecimenLeafProps = {
  image?: string | null;
  alt?: string;
  number?: string;
  size?: "hero" | "card" | "profile";
  positionX?: number;
  positionY?: number;
  zoom?: number;
  revivable?: boolean;
  organic?: boolean;
};

export function SpecimenLeaf({ image, alt = "", number, size = "card", positionX = 50, positionY = 50, zoom = 1, revivable = false, organic = false }: SpecimenLeafProps) {
  return (
    <div className={`specimen-leaf specimen-leaf-${size}`}>
      {organic ? <OrganicLeafArtwork revivable={revivable} /> : <>
        <span className="specimen-leaf-outline" aria-hidden="true" />
        <span className="specimen-leaf-vein" aria-hidden="true" />
        {revivable ? <>
          <span className="specimen-leaf-revival-outline" aria-hidden="true" />
          <span className="specimen-leaf-revival-vein" aria-hidden="true" />
        </> : null}
      </>}
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
