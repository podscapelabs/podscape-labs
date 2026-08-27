import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/poddex"],
    },
    sitemap: "https://podscapelabs.com/sitemap.xml",
  };
}
