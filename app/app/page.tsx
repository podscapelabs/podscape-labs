import type { Metadata } from "next";
import { MarketingSite } from "@/components/MarketingSite";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "PodScape · Early Access",
  robots: { index: false, follow: false },
};

/** Private, tester-authorized platform home. Middleware checks access first. */
export default function AppPage() {
  return <MarketingSite />;
}
