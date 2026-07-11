import type { Metadata } from "next";
import { siteContent } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteContent.brand.shortName} | ${siteContent.brand.descriptor}`,
  description:
    "Podscape Labs is an independent Canadian studio building original projects for the isopod hobby.",
  metadataBase: new URL("https://podscapelabs.com"),
  openGraph: {
    title: siteContent.brand.name,
    description:
      "An independent studio building original projects for the isopod hobby.",
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
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
