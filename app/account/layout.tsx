import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Account | Podscape Labs",
  robots: { index: false, follow: false, nocache: true },
};

export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
