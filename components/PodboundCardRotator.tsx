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
    const timer = window.setInterval(() => setActive((current) => (current + 1) % cards.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const current = cards[active];

  return (
    <button
      className="podbound-card-slot"
      type="button"
      aria-label={`Showing ${current.name}, value ${current.value}. Show next PodBound card.`}
      onClick={() => setActive((currentIndex) => (currentIndex + 1) % cards.length)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {cards.map((card, index) => (
        <Image
          className={index === active ? "is-active" : ""}
          key={card.name}
          src={card.src}
          alt={`PodBound ${card.name} card, value ${card.value}`}
          width={846}
          height={1200}
          sizes="(max-width: 819px) 220px, 230px"
        />
      ))}
    </button>
  );
}
