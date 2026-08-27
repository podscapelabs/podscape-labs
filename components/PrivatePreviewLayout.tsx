import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function PrivatePreviewLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return children;
}
