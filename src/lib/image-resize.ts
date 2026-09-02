/**
 * Camera photos off a phone or tablet run 3–8MB and are far larger than
 * anything the site actually renders, so the browser shrinks them before they
 * reach a server action. That keeps uploads well inside Next's server-action
 * body limit and off the gym's wifi for longer than necessary.
 *
 * Every path falls back to the original file: a shrink that cannot happen must
 * not stop an upload that would otherwise work.
 */

/** Longest edge we keep — the widest slot on the landing page is ~1400px. */
const MAX_EDGE = 1600;
const QUALITY = 0.85;
/** Under this, re-encoding buys nothing worth the wait on a tablet. */
const SKIP_UNDER_BYTES = 1024 * 1024;
/** Canvas has no frame loop and no vectors, so these pass through untouched. */
const PASSTHROUGH = new Set(["image/gif", "image/svg+xml"]);

export async function downscaleImage(file: File): Promise<File> {
  if (PASSTHROUGH.has(file.type)) return file;
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // HEIC and anything else Chrome cannot decode lands here. Send the original
    // and let the server say what it makes of it.
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SKIP_UNDER_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // PNG and WebP keep their own format so transparent pillar icons stay
    // transparent; a JPEG re-encode would flatten the alpha to black.
    const type =
      file.type === "image/png" || file.type === "image/webp"
        ? file.type
        : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renameFor(file.name, type), {
      type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

function renameFor(name: string, type: string) {
  const extension =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const base = name.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.${extension}`;
}
