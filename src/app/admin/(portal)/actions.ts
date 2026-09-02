"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/r2";

const MAX_BYTES = 8 * 1024 * 1024;

/** Some Android gallery pickers hand back an empty `File.type`. */
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i;

// Server actions are reserved for file uploads (see CLAUDE.md); every other
// mutation goes through tRPC. tRPC's adminProcedure does not cover actions, so
// the admin check is repeated here.
async function isAdmin() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  return session?.user.role === "admin";
}

/**
 * Uploads one admin-picked image to R2.
 *
 * Returns the failure instead of throwing — Next.js redacts server-action error
 * messages in production, so a thrown validation message reaches the browser as
 * nothing but "Minified React error #441".
 */
export async function uploadImageAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  if (!(await isAdmin())) return { error: "Not authorised." };

  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Choose an image first." };
  const looksLikeImage = file.type
    ? file.type.startsWith("image/")
    : IMAGE_EXTENSION.test(file.name);
  if (!looksLikeImage) return { error: "That is not an image file." };
  if (file.size > MAX_BYTES) return { error: "Image is larger than 8 MB." };

  const prefix = String(formData.get("prefix") ?? "gallery");
  const safePrefix = /^[a-z-]+$/.test(prefix) ? prefix : "gallery";

  try {
    return { url: await uploadImage(file, safePrefix) };
  } catch (cause) {
    console.error("Image upload failed", cause);
    return { error: "Upload failed. Please try again." };
  }
}
