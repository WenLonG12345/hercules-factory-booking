"use server";

import { headers } from "next/headers";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { uploadImage } from "@/lib/r2";
import { photoSubmissionInput } from "@/server/validators/cms";

const MAX_BYTES = 8 * 1024 * 1024;
const COOLDOWN_MS = 60_000;

// ponytail: in-memory per-IP cooldown, good enough for one instance. Move it to
// a database lookup if the app ever scales out or someone actually tries to
// flood the bucket.
const lastSubmission = new Map<string, number>();

/**
 * Public, unauthenticated: a visitor drops a training photo through the FAB.
 * It lands in the gallery table as an inactive row, invisible until an admin
 * approves it in the CMS.
 *
 * Returns the failure instead of throwing — Next.js redacts server-action error
 * messages in production, so a thrown validation message never reaches the user.
 */
export async function submitPhotoAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = photoSubmissionInput.safeParse({
    name: formData.get("name"),
    caption: formData.get("caption") || undefined,
  });
  if (!parsed.success) return { error: "Enter your name (2–40 characters)." };
  const { name, caption } = parsed.data;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Choose a photo first." };
  if (!file.type.startsWith("image/"))
    return { error: "That is not an image." };
  if (file.size > MAX_BYTES) return { error: "Photo is larger than 8 MB." };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const previous = lastSubmission.get(ip);
  if (previous && Date.now() - previous < COOLDOWN_MS)
    return { error: "Thanks! Please wait a minute before sending another." };
  lastSubmission.set(ip, Date.now());

  try {
    const imageUrl = await uploadImage(file, "submissions");
    await getDb()
      .insert(galleryImages)
      .values({
        imageUrl,
        alt: caption ?? `Training photo shared by ${name}`,
        caption,
        submittedBy: name,
        isActive: false,
      });
  } catch (cause) {
    console.error("Photo submission failed", cause);
    return { error: "Upload failed. Please try again." };
  }

  return {};
}
