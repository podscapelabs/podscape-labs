/** Owner-only destinations shared by Account and the full Owner Tools hub. */
export const ownerDesks = [
  { title: "Spotlight Desk", label: "Homepage", description: "Curate homepage highlights and their order.", href: "/admin/spotlight", symbol: "✧" },
  { title: "Species Desk", label: "Leaf Ledger", description: "Manage species records and images.", href: "/admin/species", symbol: "❧" },
  { title: "Product Desk", label: "Shop", description: "Manage listings, prices and inventory.", href: "/admin/products", symbol: "▣" },
  { title: "Guide Desk", label: "Field Guide", description: "Write and publish care guides.", href: "/admin/guides", symbol: "▤" },
  { title: "Lab Desk", label: "From the Lab", description: "Manage studio notes and updates.", href: "/admin/lab", symbol: "✧" },
  { title: "PodBound Card Desk", label: "PodBound", description: "Manage game cards and artwork.", href: "/admin/podbound", symbol: "✦" },
] as const;

export const ownerOperations = [
  { title: "Early Access", description: "Approve testers and manage invitations.", href: "/admin/early-access", symbol: "♧" },
  { title: "Manager", description: "Open your colony management dashboard.", href: "/keeper", symbol: "▤" },
  { title: "Owner Security", description: "Update your owner password.", href: "/admin/reset-password", symbol: "◇" },
] as const;
