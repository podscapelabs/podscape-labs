import type { NextRequest } from "next/server";
import { refreshCustomerSession } from "@/lib/customer-auth/middleware";

export async function middleware(request: NextRequest) {
  return refreshCustomerSession(request);
}

export const config = {
  matcher: ["/account/:path*"],
};
