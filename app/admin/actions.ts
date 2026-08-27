"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  isValidAdminPassword,
} from "@/lib/admin-auth";

export type AdminLoginState = {
  error: string;
};

export async function signInAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!isAdminConfigured()) {
    return { error: "Owner access has not been configured yet." };
  }

  const password = String(formData.get("password") || "");

  if (!isValidAdminPassword(password)) {
    return { error: "That password is not correct." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function signOutAdmin() {
  await destroyAdminSession();
  redirect("/admin");
}
