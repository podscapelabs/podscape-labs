export type LabNote = {
  category: string;
  date: string;
  title: string;
  summary: string;
  href: string;
};

export const siteContent = {
  brand: {
    name: "Podscape Labs™",
    shortName: "Podscape Labs",
    descriptor: "Independent Canadian Studio",
    location: "Ontario, Canada",
  },
  navigation: [
    { label: "Explore", href: "/admin/preview#explore" },
    { label: "PodDex", href: "/poddex" },
    { label: "From the Lab", href: "/admin/preview#lab" },
    { label: "About", href: "/admin/preview#about" },
  ],
  hero: {
    eyebrow: "An independent isopod hobby platform",
    title: "Original tools, games, and resources for the isopod hobby.",
    body: "Explore a growing field archive, discover original projects, and follow new work from Podscape Labs in Ontario, Canada.",
    primaryAction: { label: "Explore PodDex", href: "/poddex" },
    secondaryAction: { label: "Explore PodBound", href: "https://www.podbound.net" },
  },
  destinations: [
    {
      key: "poddex",
      index: "01",
      name: "PodDex",
      eyebrow: "Field archive",
      description: "A growing field index and collection-minded species archive for the isopod hobby.",
      href: "/poddex",
      cta: "Explore PodDex",
    },
    {
      key: "podbound",
      index: "02",
      name: "PodBound",
      eyebrow: "Tabletop strategy",
      description: "An original forecast-based tabletop game about guiding an isopod colony through changing pressures.",
      href: "https://www.podbound.net",
      cta: "Explore PodBound",
    },
    {
      key: "guide",
      index: "03",
      name: "Field Guide",
      eyebrow: "Keeper references",
      description: "Fast, useful reference notes designed to make everyday keeping decisions clearer.",
      href: "/admin/preview#field-guide",
      cta: "Browse Field Guide",
    },
    {
      key: "lab",
      index: "04",
      name: "From the Lab",
      eyebrow: "Studio notebook",
      description: "Development notes, experiments, project progress, and new releases from the studio.",
      href: "/admin/preview#lab",
      cta: "From the Lab",
    },
  ],
  podbound: {
    name: "PodBound™",
    tagline: "Forecast. Adapt. Grow.",
    status: "Currently in active playtesting",
    description:
      "PodBound™ is a 1–4 player forecast-based tabletop strategy game. Players study a visible forecast, choose an isopod species, and guide their colony through changing habitat pressures.",
    url: "https://www.podbound.net",
    linkLabel: "Enter PodBound",
  },
  fieldGuide: {
    eyebrow: "Field Guide",
    title: "Useful reference, without the noise.",
    body: "A future home for concise keeper references, practical definitions, and field notes connected to PodDex records.",
    topics: ["Species language", "Habitat basics", "Observation notes"],
  },
  lab: {
    eyebrow: "From the Lab",
    title: "Work in progress, recorded with purpose.",
    intro: "Development updates, PodDex releases, PodBound changes, and the occasional studio note.",
    notes: [
      {
        category: "Platform",
        date: "August 2026",
        title: "Building PodDex as a living field archive",
        summary: "A first look at the catalogue structure, release waves, and the leaf-card system taking shape.",
        href: "/poddex",
      },
      {
        category: "PodBound",
        date: "July 2026",
        title: "Ten rounds, clearer decisions",
        summary: "Recent playtest work on the visible forecast, colony decisions, and timing at the table.",
        href: "https://www.podbound.net",
      },
      {
        category: "Studio note",
        date: "June 2026",
        title: "A platform built to keep growing",
        summary: "Why Podscape is becoming a useful home for tools, original projects, and field references.",
        href: "/admin/preview#about",
      },
    ] satisfies LabNote[],
  },
  about: {
    eyebrow: "About Podscape",
    title: "Independent by design. Built for the hobby.",
    body: "Podscape Labs is an independent Canadian studio creating original tools, games, and resources for the isopod hobby. It is a place for patient, useful work—beginning with PodDex and PodBound.",
  },
  social: {
    facebook: { label: "Facebook", href: "https://facebook.com/placeholder" },
    discord: { label: "Discord", href: "https://discord.com/placeholder" },
  },
  footer: {
    copyright: "© 2026 Podscape Labs™",
  },
} as const;
