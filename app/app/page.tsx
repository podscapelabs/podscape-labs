import type { Metadata } from "next";
import AdminPreviewPage from "@/app/admin/preview/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "PodScape",
  robots: { index: false, follow: false },
};

/** Root-level launch route keeps the installed web app's inferred scope at `/`. */
export default AdminPreviewPage;
