"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const cards = [
  { src: "/assets/podbound/cards/rotting-wood.jpg", name: "Rotting Wood", value: 3 },
  { src: "/assets/podbound/cards/leaf-litter.jpg", name: "Leaf Litter", value: 2 },
  { src: "/assets/podbound/cards/eggshells.jpg", name: "Eggshells", value: 4 },
  { src: "/assets/podbound/cards/moss.jpg", name: "Moss", value: 2 },
] as const;

export function PodboundCardRotator() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % cards.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const current = cards[active];

  return (
    <button
      className="podbound-card-stack"
      type="button"
      aria-label={`Showing ${current.name}, value ${current.value}, at the front of the PodBound card stack. Show next card.`}
      onClick={() => setActive((currentIndex) => (currentIndex + 1) % cards.length)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {cards.map((card, index) => {
        const offset = (index - active + cards.length) % cards.length;
        const position = offset === 0 ? "front" : offset === 1 ? "right" : offset === cards.length - 1 ? "left" : "hidden";

        return (
          <Image
            className="podbound-stack-card"
            data-position={position}
            key={card.name}
            src={card.src}
            alt=""
            aria-hidden="true"
            width={848}
            height={1200}
            sizes="(max-width: 819px) 46vw, 190px"
          />
        );
      })}
    </button>
  );
}
