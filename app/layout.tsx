import type { Metadata, Viewport } from "next";
import { siteContent } from "@/content/site";
import "./globals.css";
import { OwnerAwareMobileNav } from "@/components/OwnerAwareMobileNav";
import { AchievementToast } from "@/components/AchievementToast";
import { AppSwipeBack } from "@/components/AppSwipeBack";
import { OnlinePresenceProvider } from "@/components/OnlinePresenceProvider";
import {THEMES,THEME_STORAGE_KEY} from "@/lib/theme-registry";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eee8d8" },
    { media: "(prefers-color-scheme: dark)", color: "#12231a" },
  ],
};

export const metadata: Metadata = {
  title: `${siteContent.brand.shortName} | Tools, games, and resources for the isopod hobby`,
  description:
    "PodScape Labs is an independent Canadian studio creating original tools, games, and resources for the isopod hobby.",
  metadataBase: new URL("https://podscapelabs.com"),
  applicationName: "PodScape Labs",
  icons: { apple: "/podscape-apple-touch-icon.png", icon: [{ url: "/podscape-icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/podscape-icon-512.png", sizes: "512x512", type: "image/png" }] },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PodScape" },
  openGraph: {
    title: siteContent.brand.name,
    description:
      "Original tools, games, and resources for the isopod hobby.",
    type: "website",
    locale: "en_CA",
  },
};

// First paint uses the same registry as the appearance picker and theme toggle.
// System resolves to Light/Dark; all other registered palettes are first-class.
const themeIds=THEMES.map(t=>t.id);
const themeSchemes=Object.fromEntries(THEMES.map(t=>[t.id,t.scheme]));
const themeScript = `
  try {
    const ids = ${JSON.stringify(themeIds)};
    const schemes = ${JSON.stringify(themeSchemes)};
    const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const preference = ids.includes(saved) || saved === "system" ? saved : "system";
    const theme = preference !== "system" ? preference
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = schemes[theme] || "light";
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><OnlinePresenceProvider>{children}<AppSwipeBack /><AchievementToast /><OwnerAwareMobileNav /></OnlinePresenceProvider></body>
    </html>
  );
}
