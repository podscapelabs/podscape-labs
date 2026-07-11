export type LabNote = {
  date: string;
  title: string;
  summary: string;
  imageLabel: string;
};

export const siteContent = {
  brand: {
    name: "Podscape Labs™",
    shortName: "Podscape Labs",
    descriptor: "Independent Canadian Studio",
    location: "Ontario, Canada",
  },
  navigation: [
    { label: "Projects", href: "#projects" },
    { label: "From the Lab", href: "#lab" },
    { label: "About", href: "#about" },
  ],
  hero: {
    eyebrow: "Independent Canadian Studio",
    title: "An independent studio building original projects for the isopod hobby.",
    body: "Thoughtful, original work from Ontario, Canada.",
    primaryAction: { label: "Explore PodBound™", href: "https://podbound.net" },
    secondaryAction: { label: "Follow the Journey", href: "#lab" },
  },
  podbound: {
    name: "PodBound™",
    tagline: "Forecast. Adapt. Grow.",
    status: "Currently in active playtesting",
    description:
      "PodBound™ is a 1–4 player forecast-based tabletop strategy game. Players study a visible forecast, choose an isopod species, and guide their colony through changing habitat pressures.",
    url: "https://podbound.net",
    linkLabel: "Visit podbound.net",
  },
  lab: {
    eyebrow: "From the Lab",
    title: "Notes on work in progress.",
    intro:
      "Occasional records from the studio: project development, material decisions, and details worth keeping.",
    notes: [
      {
        date: "July 2026",
        title: "Website launch",
        summary:
          "A new home for Podscape Labs and the original projects that will live under it.",
        imageLabel: "Studio desk photography coming soon",
      },
      {
        date: "June 2026",
        title: "PodBound playtest update",
        summary:
          "Recent changes to the visible forecast, colony decisions, and timing at the table.",
        imageLabel: "Playtest photography coming soon",
      },
      {
        date: "May 2026",
        title: "Merch prototypes",
        summary:
          "Early material tests and small-run ideas taking shape in the studio.",
        imageLabel: "Prototype photography coming soon",
      },
    ] satisfies LabNote[],
  },
  about: {
    eyebrow: "About",
    title: "Small by design.",
    body: "Podscape Labs is a one-person independent studio based in Ontario, Canada. It is a place for patient, original work connected to the isopod hobby, beginning with PodBound.",
  },
  social: {
    facebook: { label: "Facebook", href: "https://facebook.com/placeholder" },
    discord: { label: "Discord", href: "https://discord.com/placeholder" },
  },
  footer: {
    copyright: "© 2026 Podscape Labs™",
  },
} as const;
