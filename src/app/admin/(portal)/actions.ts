"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/r2";

// Server actions are reserved for file uploads (see CLAUDE.md); every other
// mutation goes through tRPC. tRPC's adminProcedure does not cover actions, so
// the admin check is repeated here.
async function assertAdmin() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (session?.user.role !== "admin") throw new Error("Not authorised.");
}

export async function uploadImageAction(formData: FormData) {
  await assertAdmin();

  const file = formData.get("imageFile") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("Not an image file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image is larger than 8 MB");

  const prefix = String(formData.get("prefix") ?? "gallery");
  const safePrefix = /^[a-z-]+$/.test(prefix) ? prefix : "gallery";

  return uploadImage(file, safePrefix);
}
