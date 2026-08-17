"use client";

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

  // Visitor submissions arrive inactive; approving one just activates it.
  const pendingPhotos = data.gallery.filter(
    (image) => image.submittedBy && !image.isActive,
  );
  const publishedPhotos = data.gallery.filter(
    (image) => image.isActive || !image.submittedBy,
  );

  // The landing page runs the newest active promotion; the rest wait behind it.
  const livePromo = data.promos.find((promo) => promo.isActive);

  return (
    <>
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
                {/* biome-ignore lint/performance/noImgElement: admin preview only */}
                <img
                  alt={image.alt}
                  className="h-40 w-full object-cover"
                  src={image.imageUrl}
                />
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
        hint="Upload here first — the hero image URL is copied from one of these."
        id="gallery"
        title="Gallery"
      />
      <Card className="mb-8">
        <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {publishedPhotos.map((image) => (
            <figure
              key={image.id}
              className="overflow-hidden rounded-lg border border-stone-200"
            >
              {/* biome-ignore lint/performance/noImgElement: admin preview only */}
              <img
                alt={image.alt}
                className="h-32 w-full object-cover"
                src={image.imageUrl}
              />
              <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
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
              {/* biome-ignore lint/performance/noImgElement: admin preview only */}
              <img
                alt={promo.title}
                className="aspect-9/16 w-full object-cover"
                src={promo.imageUrl}
              />
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
    </>
  );
}
