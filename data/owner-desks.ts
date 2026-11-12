import type { PodscapeIconName } from "@/components/PodscapeLineIcon";

/** Owner-only destinations shared by Account and the full Owner Tools hub. */
export const ownerDesks = [
  { title: "Species Requests", label: "Leaf Ledger", icon: "leaf" as PodscapeIconName, description: "See which species members would like added.", href: "/account/owner-tools/species-requests", symbol: "" },
  { title: "Spotlight Desk", label: "Homepage", icon: "creative" as PodscapeIconName, description: "Curate homepage highlights and their order.", href: "/admin/spotlight", symbol: "✧" },
  { title: "Updates Desk", label: "Recently Updated", icon: "news" as PodscapeIconName, description: "Draft and publish categorized platform improvements, features and announcements.", href: "/admin/updates", symbol: "✦" },
  { title: "Species Desk", label: "Leaf Ledger", icon: "leaf" as PodscapeIconName, description: "Manage species records and images.", href: "/admin/species", symbol: "❧" },
  { title: "Product Desk", label: "Shop", icon: "shop" as PodscapeIconName, description: "Manage listings, prices and inventory.", href: "/admin/products", symbol: "▣" },
  { title: "Vendor Desk", label: "Vendor Directory", icon: "vendor" as PodscapeIconName, description: "Add and publish businesses or review vendor applications.", href: "/admin/vendors", symbol: "" },
  { title: "Guide Desk", label: "Field Guide", icon: "book" as PodscapeIconName, description: "Write and publish care guides.", href: "/admin/guides", symbol: "▤" },
  { title: "Lab Desk", label: "From the Lab", icon: "note" as PodscapeIconName, description: "Manage studio notes and updates.", href: "/admin/lab", symbol: "✧" },
  { title: "Puzzle Desk", label: "Fun Zone", icon: "grid" as PodscapeIconName, description: "Create and publish picture puzzles from PodBound artwork and photos.", href: "/admin/puzzle-desk", symbol: "" },
  { title: "PodBound Card Desk", label: "PodBound", icon: "podbound" as PodscapeIconName, description: "Manage game cards and artwork.", href: "/admin/podbound", symbol: "✦" },
] as const;

export const ownerOperations = [
  { title: "Platform Analytics", description: "Accounts, registrations, online sessions and keeper activity.", href: "/account/owner-tools/analytics", icon: "community" as PodscapeIconName, symbol: "" },
  { title: "Early Access", description: "Approve testers and manage invitations.", href: "/admin/early-access", icon: "community" as PodscapeIconName, symbol: "♧" },
  { title: "Manager", description: "Open your colony management dashboard.", href: "/keeper", icon: "manager" as PodscapeIconName, symbol: "▤" },
  { title: "Owner Security", description: "Update your owner password.", href: "/admin/reset-password", icon: "note" as PodscapeIconName, symbol: "◇" },
] as const;
