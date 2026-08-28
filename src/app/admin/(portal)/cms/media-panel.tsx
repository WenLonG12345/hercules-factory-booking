"use client";

/* Hallmark · component-scope: CMS Media tab · genre: modern-minimal
 * theme: admin system preserved (stone ground, white cards, red-700 primary)
 *   — no new tokens, no new fonts
 * states: default · hover · focus-visible · active · disabled · loading ·
 *   error (toast) · success (row leaves — silent)
 * change: tile control rows were clipping their delete button at every width
 *   below 1280px, and reordering was mouse-only — 2026-08-28
 * pre-emit critique: P4 H5 E5 S5 R5 V4
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PhotoProvider, PhotoView } from "@/components/photo-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { AddGalleryDialog, AddPromoDialog } from "./add-dialogs";
import {
  type CmsData,
  DeleteButton,
  SectionHeader,
  useCmsToast,
} from "./cms-ui";

/**
 * Step a photo one place along the strip. The tiles are still natively
 * draggable, but HTML5 drag events never fire on a touchscreen — on a tablet
 * these two buttons are the only way to reorder, and they double as the
 * keyboard path (tab to one, press Enter) that the old grip handle's
 * arrow-key listener used to own.
 */
function MoveButton({
  disabled,
  hint,
  onClick,
  step,
}: {
  disabled: boolean;
  hint: string;
  onClick: () => void;
  step: -1 | 1;
}) {
  const Icon = step === -1 ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={hint}
      className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 focus-visible:ring-4 focus-visible:ring-red-600/20 disabled:pointer-events-none disabled:opacity-30 pointer-coarse:h-11 pointer-coarse:min-w-11"
      disabled={disabled}
      // Otherwise the browser hands this press to the tile's drag.
      draggable={false}
      onClick={onClick}
      title={hint}
      type="button"
    >
      <Icon className="size-4" />
    </button>
  );
}

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
  const labelGallery = api.cms.gallery.setLabel.useMutation({
    onSuccess: onSuccess("Label saved."),
    onError,
  });
  const titlePromo = api.cms.promos.setTitle.useMutation({
    onSuccess: onSuccess("Title saved."),
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendingPhotos.map((image) => (
              <figure
                key={image.id}
                className="overflow-hidden rounded-lg border border-amber-300"
              >
                <PhotoView src={image.imageUrl}>
                  {/* biome-ignore lint/performance/noImgElement: admin preview only */}
                  <img
                    alt={image.alt}
                    className="aspect-square w-full cursor-zoom-in object-cover"
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
                      className="h-9 min-w-0 flex-1 whitespace-nowrap px-2 text-xs pointer-coarse:h-11"
                      disabled={approveGallery.isPending}
                      onClick={() => approveGallery.mutate({ id: image.id })}
                      type="button"
                    >
                      Approve
                    </Button>
                    <Button
                      className="h-9 shrink-0 whitespace-nowrap px-3 text-xs pointer-coarse:h-11"
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
        hint="The photo strip on the landing page, in this order — drag a tile to move it, or use the ‹ › buttons. Any shape uploads fine — photos are cropped square (every third one taller, 4:5), so keep the subject centred. Aim for 1200px on the long side."
        id="gallery"
        title="Gallery"
      />
      <Card className="mb-8">
        {orderedPhotos.length === 0 ? (
          <p className="mb-4 text-sm text-stone-500">
            No photos on the strip yet. Add one and it lands at the end.
          </p>
        ) : null}
        <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
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
              {/* Controls sit on their own row above the label, not beside it.
                  Shoulder to shoulder they overflowed the tile, and it was the
                  delete button — last in the row — that got clipped away.
                  `flex-wrap` is the floor: on a phone the third target drops to
                  its own line instead of disappearing. */}
              <figcaption className="grid gap-1.5 px-2 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  <MoveButton
                    disabled={index === 0}
                    hint={`Move ${image.label || "photo"} earlier (position ${index + 1} of ${orderedPhotos.length})`}
                    onClick={() => moveTo(image.id, index - 1)}
                    step={-1}
                  />
                  <MoveButton
                    disabled={index === orderedPhotos.length - 1}
                    hint={`Move ${image.label || "photo"} later (position ${index + 1} of ${orderedPhotos.length})`}
                    onClick={() => moveTo(image.id, index + 1)}
                    step={1}
                  />
                  <DeleteButton
                    className="ml-auto"
                    label="Delete photo"
                    onClick={() => deleteGallery.mutate({ id: image.id })}
                    pending={deleteGallery.isPending}
                  />
                </div>
                <Input
                  // `min-w-0` is load-bearing: an `<input>` in a flex row keeps
                  // its ~173px intrinsic minimum otherwise and pushes whatever
                  // follows it out through the tile's `overflow-hidden` edge.
                  className="h-9 w-full min-w-0 px-2 text-xs pointer-coarse:h-11"
                  defaultValue={image.label ?? ""}
                  // Not draggable, or the browser hands the tile's drag to the
                  // text selection instead of letting the caret move.
                  draggable={false}
                  onDragStart={(event: React.DragEvent) =>
                    event.stopPropagation()
                  }
                  onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                    const next = event.target.value.trim();
                    if (next !== (image.label ?? ""))
                      labelGallery.mutate({ id: image.id, label: next });
                  }}
                  placeholder="Label"
                />
                {image.submittedBy ? (
                  <Badge className="max-w-full overflow-hidden" tone="gray">
                    <span className="truncate">{`by ${image.submittedBy}`}</span>
                  </Badge>
                ) : null}
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
        {data.promos.length === 0 ? (
          <p className="mb-4 text-sm text-stone-500">
            No promotion running. Add a poster and it goes live immediately.
          </p>
        ) : null}
        <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
              {/* Same shape as a gallery tile: status and controls on one row,
                  the editable field full width underneath. */}
              <figcaption className="grid gap-1.5 px-2 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  {promo.id === livePromo?.id ? (
                    <Badge tone="red">Live now</Badge>
                  ) : (
                    <Badge tone="gray">Queued</Badge>
                  )}
                  <DeleteButton
                    className="ml-auto"
                    label="Delete promotion"
                    onClick={() => deletePromo.mutate({ id: promo.id })}
                    pending={deletePromo.isPending}
                  />
                </div>
                <Input
                  className="h-9 w-full min-w-0 px-2 text-xs font-semibold pointer-coarse:h-11"
                  defaultValue={promo.title}
                  onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                    const next = event.target.value.trim();
                    if (next.length >= 2 && next !== promo.title)
                      titlePromo.mutate({ id: promo.id, title: next });
                  }}
                  placeholder="Title"
                />
              </figcaption>
            </figure>
          ))}
        </div>
        <AddPromoDialog sortOrder={data.promos.length} />
      </Card>
    </PhotoProvider>
  );
}
