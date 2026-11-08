import { isAdminAuthenticated } from "@/lib/admin-auth";
import { GlobalMobileNav } from "./GlobalMobileNav";

/** Privileged destinations must not be offered based on local browser state. */
export async function OwnerAwareMobileNav() {
  const isOwner = await isAdminAuthenticated();
  return <GlobalMobileNav isOwner={isOwner} />;
}
