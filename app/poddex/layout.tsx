import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "PodDex | Podscape Labs", template: "%s | PodDex" },
  description: "A growing field index and species archive for the isopod hobby.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PodDexLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await isAdminAuthenticated())) redirect("/");
  return children;
}
