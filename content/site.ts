export type LabNote = {
  date: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
};

export const siteContent = {
  brand: {
    name: "Podscape Labs™",
    shortName: "Podscape Labs",
    descriptor: "Independent Canadian Studio",
    location: "Ontario, Canada",
  },
  navigation: [
    { label: "Explore", href: "#explore" },
    { label: "Projects", href: "#projects" },
    { label: "From the Lab", href: "#lab" },
    { label: "About", href: "#about" },
  ],
  hero: {
    eyebrow: "Independent Canadian Studio",
    title: "Podscape Labs™",
    body: "Thoughtful, original work from Ontario, Canada.",
    primaryAction: { label: "Explore PodBound™", href: "https://www.podbound.net" },
    secondaryAction: { label: "Follow the Journey", href: "#lab" },
  },
  podbound: {
    name: "PodBound™",
    tagline: "Forecast. Adapt. Grow.",
    status: "Currently in active playtesting",
    description:
      "PodBound™ is a 1–4 player forecast-based tabletop strategy game. Players study a visible forecast, choose an isopod species, and guide their colony through changing habitat pressures.",
    url: "https://www.podbound.net",
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
        image: "/assets/podbound/cards/leaf-litter.jpg",
        imageAlt: "PodBound Leaf Litter card artwork",
      },
      {
        date: "June 2026",
        title: "PodBound playtest update",
        summary:
          "Recent changes to the visible forecast, colony decisions, and timing at the table.",
        image: "/assets/podbound/cards/rotting-wood.jpg",
        imageAlt: "PodBound Rotting Wood card artwork",
      },
      {
        date: "May 2026",
        title: "Merch prototypes",
        summary:
          "Early material tests and small-run ideas taking shape in the studio.",
        image: "/assets/podbound/cards/moss.jpg",
        imageAlt: "PodBound Moss card artwork",
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
export const homeContent = {
  "destinations": [
    {
      "name": "Leaf Ledger",
      "icon": "leaf",
      "description": "Discover species",
      "href": "#ledger",
      "status": "In planning"
    },
    {
      "name": "My Collection",
      "icon": "jar",
      "description": "Track & manage",
      "href": "#collection",
      "status": "In planning"
    },
    {
      "name": "Shop",
      "icon": "bag",
      "description": "Supplies & more",
      "href": "#shop",
      "status": "In planning"
    },
    {
      "name": "Vendors",
      "icon": "store",
      "description": "Find breeders",
      "href": "#vendors",
      "status": "In planning"
    },
    {
      "name": "Creative Network",
      "icon": "palette",
      "description": "Artists & makers",
      "href": "#creative",
      "status": "In planning"
    },
    {
      "name": "Community",
      "icon": "people",
      "description": "Share & connect",
      "href": "#community",
      "status": "In planning"
    },
    {
      "name": "Podlings",
      "icon": "pet",
      "description": "Your little companion",
      "href": "#podlings",
      "status": "In planning"
    },
    {
      "name": "PodBound",
      "icon": "cards",
      "description": "The tabletop game",
      "href": "https://www.podbound.net",
      "status": "Explore now"
    },
    {
      "name": "Guides",
      "icon": "book",
      "description": "Learn & grow",
      "href": "#guides",
      "status": "In planning"
    },
    {
      "name": "From the Lab",
      "icon": "flask",
      "description": "Projects & updates",
      "href": "#lab",
      "status": "Studio notes"
    }
  ],
  "planned": [
    {
      "id": "ledger",
      "name": "Leaf Ledger",
      "icon": "leaf",
      "description": "Discover species",
      "detail": "A planned field guide to isopod species, with profiles and care information. For now, meet a few illustrated species above."
    },
    {
      "id": "collection",
      "name": "My Collection",
      "icon": "jar",
      "description": "Track & manage",
      "detail": "A planned place to organize your colonies and keep collection notes. Collection tracking and PodScape accounts are not available yet."
    },
    {
      "id": "shop",
      "name": "Shop",
      "icon": "bag",
      "description": "Supplies & more",
      "detail": "Future supplies and original studio goods. There are no products or checkout available on PodScape yet."
    },
    {
      "id": "vendors",
      "name": "Vendors",
      "icon": "store",
      "description": "Find breeders",
      "detail": "A future directory for discovering breeders and hobby vendors. Listings and submissions are not open yet."
    },
    {
      "id": "creative",
      "name": "Creative Network",
      "icon": "palette",
      "description": "Artists & makers",
      "detail": "A future space for artists, makers, and original work inspired by the hobby. Creator profiles are still in planning."
    },
    {
      "id": "community",
      "name": "Community",
      "icon": "people",
      "description": "Share & connect",
      "detail": "A future gathering place for keepers to share discoveries and learn together. Community posting is not available yet."
    },
    {
      "id": "podlings",
      "name": "Podlings",
      "icon": "pet",
      "description": "Your little companion",
      "detail": "An idea for a small digital companion in the PodScape world. Podlings are in planning and cannot be adopted yet."
    },
    {
      "id": "guides",
      "name": "Guides",
      "icon": "book",
      "description": "Learn & grow",
      "detail": "A planned library of keeping resources, from substrate and feeding to ventilation. The guide library has not launched yet."
    }
  ],
  "species": [
    {
      "name": "Dairy Cow",
      "scientific": "Porcellio laevis",
      "variant": "cow"
    },
    {
      "name": "Papaya",
      "scientific": "Cubaris murina",
      "variant": "papaya"
    },
    {
      "name": "Panda King",
      "scientific": "Cubaris sp.",
      "variant": "panda"
    },
    {
      "name": "Clown",
      "scientific": "Armadillidium klugii",
      "variant": "clown"
    }
  ]
} as const;
