"use client";

import { GripVertical } from "lucide-react";
import { useState } from "react";
import { PhotoProvider, PhotoView } from "@/components/photo-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/trpc";
import { AddGalleryDialog, AddPromoDialog } from "./add-dialogs";
import {
  type CmsData,
  DeleteButton,
  SectionHeader,
  useCmsToast,
} from "./cms-ui";

/** Every image on the site: visitor submissions, the gallery, the poster. */
export function MediaPanel({ data }: { data: CmsData }) {
  const { onError, onSuccess } = useCmsToast();

  const deleteGallery = api.cms.gallery.delete.useMutation({
    onSuccess: onSuccess("Image removed."),
    onError,
  });
  const approveGallery = api.cms.gallery.approve.useMutation({
    onSuccess: onSuccess("Photo published to the gallery."),
    onError,
  });
  const deletePromo = api.cms.promos.delete.useMutation({
    onSuccess: onSuccess("Promotion removed."),
    onError,
  });
  const reorderGallery = api.cms.gallery.reorder.useMutation({
    onSuccess: onSuccess("Gallery order saved."),
    onError,
  });

  // Visitor submissions arrive inactive; approving one just activates it.
  const pendingPhotos = data.gallery.filter(
    (image) => image.submittedBy && !image.isActive,
  );
  const publishedPhotos = data.gallery.filter(
    (image) => image.isActive || !image.submittedBy,
  );

  // Drag order lives in local state so tiles move under the cursor instead of
  // waiting on the round trip. Compared as a set, so a local drag never trips
  // the re-seed — only adding, deleting or approving a photo does.
  const serverIds = publishedPhotos.map((image) => image.id);
  const [order, setOrder] = useState(serverIds);
  const [dragId, setDragId] = useState<string | null>(null);
  if (
    order.length !== serverIds.length ||
    serverIds.some((id) => !order.includes(id))
  )
    setOrder(serverIds);

  const orderedPhotos = order
    .map((id) => publishedPhotos.find((image) => image.id === id))
    .filter((image) => image !== undefined);

  /** Puts `id` at `index` and saves the whole sequence — the server writes
   *  `sortOrder` from the array position. */
  function moveTo(id: string, index: number) {
    const rest = order.filter((other) => other !== id);
    if (index < 0 || index > rest.length) return;
    const next = [...rest.slice(0, index), id, ...rest.slice(index)];
    setOrder(next);
    reorderGallery.mutate({ ids: next });
  }

  // The landing page runs the newest active promotion; the rest wait behind it.
  const livePromo = data.promos.find((promo) => promo.isActive);

  return (
    // One lightbox for every thumbnail on the page — click any photo to see it
    // full size, uncropped.
    <PhotoProvider maskOpacity={0.9}>
      <SectionHeader
        hint="Photos sent from the landing page wait here until you approve them."
        id="submissions"
        title={`Photo submissions (${pendingPhotos.length})`}
      />
      <Card className="mb-8">
        {pendingPhotos.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nothing waiting. Photos sent from the landing page show up here for
            approval before anyone else can see them.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pendingPhotos.map((image) => (
              <figure
                key={image.id}
                className="overflow-hidden rounded-lg border border-amber-300"
              >
                <PhotoView src={image.imageUrl}>
                  {/* biome-ignore lint/performance/noImgElement: admin preview only */}
                  <img
                    alt={image.alt}
                    className="h-40 w-full cursor-zoom-in object-cover"
                    src={image.imageUrl}
                  />
                </PhotoView>
                <figcaption className="grid gap-2 px-2 py-2">
                  <span className="truncate text-sm font-semibold">
                    {image.submittedBy}
                  </span>
                  <span className="truncate text-xs text-stone-500">
                    {image.caption ?? image.alt}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      className="h-9 flex-1 px-2 text-xs"
                      disabled={approveGallery.isPending}
                      onClick={() => approveGallery.mutate({ id: image.id })}
                      type="button"
                    >
                      Approve
                    </Button>
                    <Button
                      className="h-9 px-3 text-xs"
                      disabled={deleteGallery.isPending}
                      onClick={() => deleteGallery.mutate({ id: image.id })}
                      type="button"
                      variant="quiet"
                    >
                      Reject
                    </Button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Card>

      <SectionHeader
        hint="The photo strip on the landing page, in this order — drag a photo to move it (or focus one and press ← / →). Any shape uploads fine — photos are cropped square (every third one taller, 4:5), so keep the subject centred. Aim for 1200px on the long side."
        id="gallery"
        title="Gallery"
      />
      <Card className="mb-8">
        <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {orderedPhotos.map((image, index) => (
            // Native HTML5 drag — no library. Arrow keys do the same thing for
            // anyone not using a mouse.
            <figure
              key={image.id}
              className={`cursor-grab overflow-hidden rounded-lg border transition active:cursor-grabbing ${
                dragId === image.id
                  ? "border-red-700 opacity-40"
                  : "border-stone-200"
              }`}
              draggable
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragId(image.id)}
              onDrop={() => {
                // Target's current index: dragging right lands after it,
                // dragging left lands in its place.
                if (dragId && dragId !== image.id)
                  moveTo(dragId, order.indexOf(image.id));
                setDragId(null);
              }}
            >
              <PhotoView src={image.imageUrl}>
                {/* biome-ignore lint/performance/noImgElement: admin preview only */}
                <img
                  alt={image.alt}
                  className="aspect-square w-full cursor-zoom-in object-cover"
                  src={image.imageUrl}
                />
              </PhotoView>
              <figcaption className="flex items-center justify-between gap-1 px-2 py-1.5">
                <button
                  aria-label={`Move photo ${index + 1} of ${orderedPhotos.length}. Arrow keys reorder.`}
                  className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:ring-4 focus-visible:ring-red-600/20"
                  onKeyDown={(event) => {
                    const step =
                      event.key === "ArrowLeft"
                        ? -1
                        : event.key === "ArrowRight"
                          ? 1
                          : 0;
                    if (!step) return;
                    event.preventDefault();
                    moveTo(image.id, index + step);
                  }}
                  type="button"
                >
                  <GripVertical className="size-4" />
                </button>
                <Badge tone="gray">
                  {image.submittedBy
                    ? `by ${image.submittedBy}`
                    : (image.category ?? "—")}
                </Badge>
                <DeleteButton
                  onClick={() => deleteGallery.mutate({ id: image.id })}
                />
              </figcaption>
            </figure>
          ))}
        </div>
        <AddGalleryDialog sortOrder={data.gallery.length} />
      </Card>

      <SectionHeader
        hint="One promotion runs on the landing page at a time — the newest one. Adding a banner replaces the one showing now; delete it and the previous banner takes over."
        id="promotions"
        title="Promotions"
      />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.promos.map((promo) => (
            <figure
              key={promo.id}
              className={`overflow-hidden rounded-lg border ${
                promo.id === livePromo?.id
                  ? "border-red-700 ring-2 ring-red-700/20"
                  : "border-stone-200"
              }`}
            >
              <PhotoView src={promo.imageUrl}>
                {/* biome-ignore lint/performance/noImgElement: admin preview only */}
                <img
                  alt={promo.title}
                  className="aspect-9/16 w-full cursor-zoom-in object-cover"
                  src={promo.imageUrl}
                />
              </PhotoView>
              <figcaption className="grid gap-1.5 px-2 py-1.5">
                {promo.id === livePromo?.id ? (
                  <Badge tone="red">Live now</Badge>
                ) : (
                  <Badge tone="gray">Queued</Badge>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold">
                    {promo.title}
                  </span>
                  <DeleteButton
                    onClick={() => deletePromo.mutate({ id: promo.id })}
                  />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        <AddPromoDialog sortOrder={data.promos.length} />
      </Card>
    </PhotoProvider>
  );
}
