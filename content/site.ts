export type LabNote = {
  date: string;
  title: string;
  summary: string;
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
    primaryAction: { label: "Explore PodBound™", href: "#projects" },
    secondaryAction: { label: "Follow the Journey", href: "#lab" },
  },
  podbound: {
    name: "PodBound™",
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
        date: "2026.07",
        title: "A new home for Podscape Labs",
        summary:
          "Establishing a quieter, more flexible identity for the studio and the projects that will live under it.",
      },
      {
        date: "2026.06",
        title: "Refining the PodBound forecast",
        summary:
          "A closer look at how visible information shapes decisions, timing, and tension at the table.",
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
