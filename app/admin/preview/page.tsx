import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPreviewPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  redirect("/app");
}
