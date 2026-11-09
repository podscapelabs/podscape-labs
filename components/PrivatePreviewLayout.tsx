import { requireCustomerPreviewAccess } from "@/lib/customer-auth/access";

/** Early-access content is open to confirmed, invited members and owners.
 * Owner administration has independent owner-only guards on /admin routes.
 */
export async function PrivatePreviewLayout({ children }: { children: React.ReactNode }) {
  await requireCustomerPreviewAccess();
  return children;
}
