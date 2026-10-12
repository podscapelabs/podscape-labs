import "server-only";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/** During construction, account UI and every mutation remain owner-preview-only. */
export async function requireCustomerPreviewAccess(): Promise<void> {
  if (process.env.CUSTOMER_ACCOUNTS_PUBLIC === "true") return;
  if (!(await isAdminAuthenticated())) redirect("/admin");
}
