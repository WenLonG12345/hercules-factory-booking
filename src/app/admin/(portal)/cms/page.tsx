"use client";

import {
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Plus,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import {
  createCoachAction,
  createSocialLinkAction,
  createTestimonialAction,
  deleteCoachAction,
  deleteGalleryImageAction,
  deleteSocialLinkAction,
  deleteTestimonialAction,
  updateLandingContentAction,
  uploadGalleryImageAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageFileUpload } from "@/components/ui/file-upload";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";

function SectionHeader({
  icon: Icon,
  title,
  meta,
  color,
}: {
  icon: React.ElementType;
  title: string;
  meta: string;
  color: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-5">
      <div className={`grid size-9 place-items-center rounded-lg ${color}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <h2 className="font-black text-stone-950">{title}</h2>
        <p className="text-xs text-stone-400">{meta}</p>
      </div>
    </div>
  );
}

function AddDivider({ label }: { label: string }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
      <Plus className="size-3.5" />
      {label}
    </p>
  );
}

export default function CmsPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.cms.publicContent.useQuery();
  const refetch = () => utils.cms.publicContent.invalidate();

  const { content, gallery = [], coaches = [], testimonials = [], socialLinks = [] } =
    data ?? {};

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Content" title="Landing page CMS" />

      <div className="grid gap-6">
        {/* ── Hero, CTAs, About, Location ── */}
        <Card>
          <SectionHeader
            color="bg-red-50 text-red-700"
            icon={FileText}
            meta="Main headline, CTAs, about text, and location"
            title="Hero & Content"
          />
          <ActionForm
            action={updateLandingContentAction}
            successMessage="Content saved"
            className="grid gap-5"
            onSuccess={refetch}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hero title">
                <Input
                  name="heroTitle"
                  defaultValue={content?.heroTitle ?? ""}
                  placeholder="Hercules Factory Muay Thai"
                />
              </Field>
              <Field label="Hero subtitle">
                <Textarea
                  className="min-h-11"
                  name="heroSubtitle"
                  defaultValue={content?.heroSubtitle ?? ""}
                  placeholder="Hard rounds, sharp coaching…"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary CTA button">
                <Input
                  name="primaryCtaText"
                  defaultValue={content?.primaryCtaText ?? ""}
                  placeholder="Book Your First Class"
                />
              </Field>
              <Field label="Secondary CTA button">
                <Input
                  name="secondaryCtaText"
                  defaultValue={content?.secondaryCtaText ?? ""}
                  placeholder="WhatsApp Us"
                />
              </Field>
            </div>
            <hr className="border-stone-100" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="About title">
                <Input
                  name="aboutTitle"
                  defaultValue={content?.aboutTitle ?? ""}
                  placeholder="Built for real progress"
                />
              </Field>
              <Field label="About body">
                <Textarea
                  name="aboutBody"
                  defaultValue={content?.aboutBody ?? ""}
                  placeholder="We train beginners, returning fighters…"
                />
              </Field>
            </div>
            <hr className="border-stone-100" />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Location title">
                <Input
                  name="locationTitle"
                  defaultValue={content?.locationTitle ?? ""}
                  placeholder="Train with us"
                />
              </Field>
              <Field label="Location address">
                <Input
                  name="locationAddress"
                  defaultValue={content?.locationAddress ?? ""}
                  placeholder="Jalan Cerdas, Taman Connaught, KL"
                />
              </Field>
              <Field label="Map embed URL">
                <Input
                  name="mapEmbedUrl"
                  defaultValue={content?.mapEmbedUrl ?? ""}
                  placeholder="https://www.google.com/maps/embed?…"
                />
              </Field>
            </div>
            <div>
              <Button type="submit">Save content</Button>
            </div>
          </ActionForm>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* ── Gallery ── */}
          <Card>
            <SectionHeader
              color="bg-amber-50 text-amber-700"
              icon={ImageIcon}
              meta={`${gallery.length} image${gallery.length !== 1 ? "s" : ""}`}
              title="Gallery"
            />
            {gallery.length > 0 ? (
              <div className="mb-5 grid grid-cols-2 gap-3">
                {gallery.map((image) => (
                  <div
                    className="group relative overflow-hidden rounded-lg border border-stone-200"
                    key={image.id}
                  >
                    {/* biome-ignore lint/performance/noImgElement: CMS user-uploaded images have unknown dimensions */}
                    <img
                      alt={image.alt}
                      className="h-28 w-full object-cover"
                      src={image.imageUrl}
                    />
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-stone-700">
                        {image.caption || image.alt}
                      </p>
                    </div>
                    <ActionForm
                      action={deleteGalleryImageAction}
                      successMessage="Image deleted"
                      className="absolute right-2 top-2"
                      onSuccess={refetch}
                    >
                      <input name="id" type="hidden" value={image.id} />
                      <button
                        className="grid size-7 place-items-center rounded bg-black/60 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                        type="submit"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </ActionForm>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-5 rounded-lg border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400">
                No images yet — upload one below.
              </p>
            )}
            <div className="border-t border-stone-100 pt-4">
              <AddDivider label="Upload image" />
              <ActionForm
                action={uploadGalleryImageAction}
                successMessage="Image uploaded"
                className="grid gap-3"
                resetOnSuccess
                onSuccess={refetch}
              >
                <ImageFileUpload name="imageFile" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input name="alt" placeholder="Alt text" />
                  <Input name="caption" placeholder="Caption" />
                </div>
                <Input name="sortOrder" placeholder="Sort order (0, 1, 2…)" type="number" />
                <Button type="submit" variant="quiet">Upload image</Button>
              </ActionForm>
            </div>
          </Card>

          {/* ── Right column stack ── */}
          <div className="grid gap-6">
            {/* Coaches */}
            <Card>
              <SectionHeader
                color="bg-blue-50 text-blue-700"
                icon={Users}
                meta={`${coaches.length} coach${coaches.length !== 1 ? "es" : ""}`}
                title="Coaches"
              />
              {coaches.length > 0 && (
                <div className="mb-4 grid gap-2">
                  {coaches.map((coach) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border border-stone-100 p-3"
                      key={coach.id}
                    >
                      {coach.imageUrl && (
                        // biome-ignore lint/performance/noImgElement: CMS coach images have unknown dimensions
                        <img
                          alt={coach.name}
                          className="size-10 shrink-0 rounded-md object-cover"
                          src={coach.imageUrl}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-stone-950">{coach.name}</p>
                        <p className="text-xs text-amber-700">{coach.title}</p>
                      </div>
                      <ActionForm action={deleteCoachAction} successMessage="Coach deleted" onSuccess={refetch}>
                        <input name="id" type="hidden" value={coach.id} />
                        <button
                          className="grid size-7 place-items-center rounded text-stone-300 transition hover:bg-red-50 hover:text-red-600"
                          type="submit"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </ActionForm>
                    </div>
                  ))}
                </div>
              )}
              <div className={coaches.length > 0 ? "border-t border-stone-100 pt-4" : ""}>
                {coaches.length > 0 && <AddDivider label="Add coach" />}
                <ActionForm
                  action={createCoachAction}
                  successMessage="Coach added"
                  className="grid gap-3"
                  resetOnSuccess
                  onSuccess={refetch}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="name" placeholder="Name" />
                    <Input name="title" placeholder="Title / Role" />
                  </div>
                  <Textarea className="min-h-18" name="bio" placeholder="Bio" />
                  <Input name="imageUrl" placeholder="Image URL" />
                  <Button type="submit" variant="quiet">Add coach</Button>
                </ActionForm>
              </div>
            </Card>

            {/* Testimonials */}
            <Card>
              <SectionHeader
                color="bg-emerald-50 text-emerald-700"
                icon={MessageSquare}
                meta={`${testimonials.length} review${testimonials.length !== 1 ? "s" : ""}`}
                title="Testimonials"
              />
              {testimonials.length > 0 && (
                <div className="mb-4 grid gap-2">
                  {testimonials.map((t) => (
                    <div
                      className="flex items-start gap-3 rounded-lg border border-stone-100 p-3"
                      key={t.id}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex gap-0.5 text-amber-400">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: static stars
                            <Star className="size-3 fill-current" key={i} />
                          ))}
                        </div>
                        <p className="line-clamp-2 text-xs text-stone-600">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <p className="mt-1 text-xs font-black text-stone-800">— {t.customerName}</p>
                      </div>
                      <ActionForm action={deleteTestimonialAction} successMessage="Review deleted" onSuccess={refetch}>
                        <input name="id" type="hidden" value={t.id} />
                        <button
                          className="mt-0.5 grid size-7 place-items-center rounded text-stone-300 transition hover:bg-red-50 hover:text-red-600"
                          type="submit"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </ActionForm>
                    </div>
                  ))}
                </div>
              )}
              <div className={testimonials.length > 0 ? "border-t border-stone-100 pt-4" : ""}>
                {testimonials.length > 0 && <AddDivider label="Add review" />}
                <ActionForm
                  action={createTestimonialAction}
                  successMessage="Review added"
                  className="grid gap-3"
                  resetOnSuccess
                  onSuccess={refetch}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="customerName" placeholder="Customer name" />
                    <Input defaultValue="5" max="5" min="1" name="rating" placeholder="Rating 1–5" type="number" />
                  </div>
                  <Textarea className="min-h-18" name="quote" placeholder="Quote" />
                  <Button type="submit" variant="quiet">Add review</Button>
                </ActionForm>
              </div>
            </Card>

            {/* Social Links */}
            <Card>
              <SectionHeader
                color="bg-violet-50 text-violet-700"
                icon={Link2}
                meta={`${socialLinks.length} link${socialLinks.length !== 1 ? "s" : ""}`}
                title="Social links"
              />
              {socialLinks.length > 0 && (
                <div className="mb-4 grid gap-2">
                  {socialLinks.map((link) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border border-stone-100 p-3"
                      key={link.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black capitalize text-stone-950">{link.platform}</p>
                        <p className="truncate text-xs text-stone-400">{link.url}</p>
                      </div>
                      <ActionForm action={deleteSocialLinkAction} successMessage="Link deleted" onSuccess={refetch}>
                        <input name="id" type="hidden" value={link.id} />
                        <button
                          className="grid size-7 place-items-center rounded text-stone-300 transition hover:bg-red-50 hover:text-red-600"
                          type="submit"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </ActionForm>
                    </div>
                  ))}
                </div>
              )}
              <div className={socialLinks.length > 0 ? "border-t border-stone-100 pt-4" : ""}>
                {socialLinks.length > 0 && <AddDivider label="Add link" />}
                <ActionForm
                  action={createSocialLinkAction}
                  successMessage="Link added"
                  className="grid gap-3"
                  resetOnSuccess
                  onSuccess={refetch}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="platform" placeholder="Platform (instagram, whatsapp…)" />
                    <Input name="label" placeholder="Label" />
                  </div>
                  <Input name="url" placeholder="URL or phone number" />
                  <Button type="submit" variant="quiet">Add link</Button>
                </ActionForm>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
