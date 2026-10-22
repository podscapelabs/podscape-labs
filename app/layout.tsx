import type { Metadata } from "next";
import { siteContent } from "@/content/site";
import "./globals.css";
import { GlobalMobileNav } from "@/components/GlobalMobileNav";
import { AchievementToast } from "@/components/AchievementToast";

export const metadata: Metadata = {
  title: `${siteContent.brand.shortName} | Tools, games, and resources for the isopod hobby`,
  description:
    "Podscape Labs is an independent Canadian studio creating original tools, games, and resources for the isopod hobby.",
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

const themeScript = `
  try {
    const saved = localStorage.getItem("podscape-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.dataset.themePreference = saved === "light" || saved === "dark" ? saved : "system";
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}<AchievementToast /><GlobalMobileNav /></body>
    </html>
  );
}
