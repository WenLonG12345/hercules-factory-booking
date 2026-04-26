"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ImageFileUpload({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    setFilename(null);
    if (inputRef.current) inputRef.current.value = "";
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
        <div className="relative overflow-hidden rounded-lg border border-stone-200">
          <img
            alt="Preview"
            className="h-48 w-full object-cover"
            src={preview}
          />
          <div className="flex items-center justify-between bg-stone-50 px-3 py-2">
            <p className="truncate text-xs font-semibold text-stone-600">
              {filename}
            </p>
            <button
              className="ml-2 shrink-0 rounded p-0.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
              onClick={clear}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-stone-200 px-6 py-10 transition",
            dragging
              ? "border-red-400 bg-red-50"
              : "hover:border-stone-300 hover:bg-stone-50",
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
          <div className="grid size-12 place-items-center rounded-full bg-stone-100">
            <ImagePlus className="size-5 text-stone-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">
              Click to upload
              <span className="font-normal text-stone-400"> or drag & drop</span>
            </p>
            <p className="mt-1 text-xs text-stone-400">PNG, JPG, WEBP</p>
          </div>
        </button>
      )}
    </div>
  );
}
