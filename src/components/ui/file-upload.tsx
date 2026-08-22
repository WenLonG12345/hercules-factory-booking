"use client";

import { ImagePlus, RefreshCw, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * One image control: an empty drop zone until there is a picture, then the
 * picture itself with Replace / Remove under it. `initialPreview` seeds it with
 * the image already saved on the row; `onClear` lets the caller drop that URL.
 */
export function ImageFileUpload({
  name,
  className,
  initialPreview,
  onClear,
  previewClassName = "aspect-video w-full object-cover",
}: {
  name: string;
  className?: string;
  initialPreview?: string | null;
  onClear?: () => void;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null);
  const [filename, setFilename] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function clear() {
    setPreview(null);
    setFilename(null);
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        accept="image/*"
        className="sr-only"
        name={name}
        type="file"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
          {/* biome-ignore lint/performance/noImgElement: admin preview only */}
          <img alt="Preview" className={previewClassName} src={preview} />
          <div className="flex items-center justify-between gap-2 border-t border-stone-200 bg-white px-3 py-2">
            <p className="truncate text-xs text-stone-500">
              {filename ?? "Current image"}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <RefreshCw className="size-3.5" />
                Replace
              </button>
              <button
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                onClick={clear}
                type="button"
              >
                <X className="size-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition",
            dragging
              ? "border-red-400 bg-red-50"
              : "border-stone-200 hover:border-stone-300 hover:bg-stone-50",
          )}
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="grid size-10 place-items-center rounded-full bg-stone-100">
            <ImagePlus className="size-4.5 text-stone-400" />
          </div>
          <p className="text-sm font-semibold text-stone-700">
            Click to upload
            <span className="font-normal text-stone-400"> or drag & drop</span>
          </p>
          <p className="text-xs text-stone-400">PNG, JPG, WEBP — up to 8 MB</p>
        </button>
      )}
    </div>
  );
}
