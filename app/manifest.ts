import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "PodScape Labs", short_name: "PodScape",
    start_url: "/app", scope: "/", display: "standalone",
    background_color: "#f2eee3", theme_color: "#f2eee3",
    icons: [
      { src: "/podscape-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/podscape-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
