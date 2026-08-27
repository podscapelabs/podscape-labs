import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/poddex", "/ledger", "/explore", "/field-guide", "/from-the-lab", "/search"],
    },
    sitemap: "https://podscapelabs.com/sitemap.xml",
  };
}
