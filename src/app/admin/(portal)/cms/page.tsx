"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadImageAction } from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageFileUpload } from "@/components/ui/file-upload";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";

const SECTIONS = [
  ["hero", "Hero"],
  ["why", "Why"],
  ["classes", "Classes"],
  ["submissions", "Submissions"],
  ["gallery", "Gallery"],
  ["reviews", "Reviews"],
  ["faq", "FAQ"],
  ["location", "Location"],
  ["social", "Social"],
] as const;

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h2 className="mb-3 scroll-mt-24 text-xl font-black" id={id}>
      {title}
    </h2>
  );
}

export default function CmsPage() {
  const utils = api.useUtils();
  const [uploading, startUpload] = useTransition();
  const [galleryUrl, setGalleryUrl] = useState("");

  const { data, isLoading } = api.cms.allContent.useQuery();

  const invalidate = () => {
    utils.cms.allContent.invalidate();
    utils.cms.publicContent.invalidate();
  };
  const onError = (error: { message: string }) => toast.error(error.message);
  const onSuccess = (message: string) => () => {
    toast.success(message);
    invalidate();
  };

  const saveContent = api.cms.updateLandingContent.useMutation({
    onSuccess: onSuccess("Landing content saved."),
    onError,
  });
  const createWhy = api.cms.why.create.useMutation({
    onSuccess: onSuccess("Pillar added."),
    onError,
  });
  const deleteWhy = api.cms.why.delete.useMutation({
    onSuccess: onSuccess("Pillar removed."),
    onError,
  });
  const createClass = api.cms.classes.create.useMutation({
    onSuccess: onSuccess("Class added."),
    onError,
  });
  const deleteClass = api.cms.classes.delete.useMutation({
    onSuccess: onSuccess("Class removed."),
    onError,
  });
  const createFaq = api.cms.faq.create.useMutation({
    onSuccess: onSuccess("FAQ added."),
    onError,
  });
  const deleteFaq = api.cms.faq.delete.useMutation({
    onSuccess: onSuccess("FAQ removed."),
    onError,
  });
  const createGallery = api.cms.gallery.create.useMutation({
    onSuccess: () => {
      setGalleryUrl("");
      toast.success("Image added.");
      invalidate();
    },
    onError,
  });
  const deleteGallery = api.cms.gallery.delete.useMutation({
    onSuccess: onSuccess("Image removed."),
    onError,
  });
  const approveGallery = api.cms.gallery.approve.useMutation({
    onSuccess: onSuccess("Photo published to the gallery."),
    onError,
  });
  const createReview = api.cms.reviews.create.useMutation({
    onSuccess: onSuccess("Review added."),
    onError,
  });
  const deleteReview = api.cms.reviews.delete.useMutation({
    onSuccess: onSuccess("Review removed."),
    onError,
  });
  const createSocial = api.cms.social.create.useMutation({
    onSuccess: onSuccess("Link added."),
    onError,
  });
  const deleteSocial = api.cms.social.delete.useMutation({
    onSuccess: onSuccess("Link removed."),
    onError,
  });

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-stone-200" />
        {["a", "b", "c"].map((k) => (
          <div key={k} className="h-52 rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const content = data.content;
  // Visitor submissions arrive inactive; approving one just activates it.
  const pendingPhotos = data.gallery.filter(
    (image) => image.submittedBy && !image.isActive,
  );
  const publishedPhotos = data.gallery.filter(
    (image) => image.isActive || !image.submittedBy,
  );

  return (
    <>
      <PageHeader eyebrow="Website" title="Landing page CMS">
        <nav className="flex flex-wrap gap-2">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold"
              href={`#${id}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </PageHeader>

      <SectionHeader id="hero" title="Hero, WhatsApp & section titles" />
      <Card className="mb-8">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            saveContent.mutate({
              heroKicker: String(fd.get("heroKicker")),
              heroHeadline: String(fd.get("heroHeadline")),
              heroSubtitle: String(fd.get("heroSubtitle")),
              heroImageUrl: String(fd.get("heroImageUrl") ?? "") || undefined,
              primaryCtaText: String(fd.get("primaryCtaText")),
              whatsappPhone: String(fd.get("whatsappPhone")),
              whatsappMessage: String(fd.get("whatsappMessage")),
              whyTitle: String(fd.get("whyTitle")),
              classesTitle: String(fd.get("classesTitle")),
              galleryTitle: String(fd.get("galleryTitle")),
              testimonialsTitle: String(fd.get("testimonialsTitle")),
              faqTitle: String(fd.get("faqTitle")),
              locationTitle: String(fd.get("locationTitle")),
              locationAddress: String(fd.get("locationAddress")),
              mapEmbedUrl: String(fd.get("mapEmbedUrl") ?? "") || undefined,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero kicker">
              <Input
                defaultValue={content?.heroKicker ?? "HERCULES FACTORY"}
                name="heroKicker"
                required
              />
            </Field>
            <Field label="Primary CTA text">
              <Input
                defaultValue={content?.primaryCtaText ?? "BOOK A CLASS"}
                name="primaryCtaText"
                required
              />
            </Field>
          </div>
          <Field label="Hero headline">
            <Input
              defaultValue={content?.heroHeadline ?? "MUAY THAI FOR EVERYONE"}
              name="heroHeadline"
              required
            />
          </Field>
          <Field label="Hero subtitle">
            <Input
              defaultValue={
                content?.heroSubtitle ?? "Beginners. Fitness. Fighters."
              }
              name="heroSubtitle"
              required
            />
          </Field>
          <Field label="Hero image URL">
            <Input
              defaultValue={content?.heroImageUrl ?? ""}
              name="heroImageUrl"
              placeholder="Upload in the gallery below, then paste the URL"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp phone">
              <Input
                defaultValue={content?.whatsappPhone ?? ""}
                name="whatsappPhone"
                placeholder="60123456789"
                required
              />
            </Field>
            <Field label="Prefilled WhatsApp message">
              <Input
                defaultValue={content?.whatsappMessage ?? ""}
                name="whatsappMessage"
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Why title">
              <Input
                defaultValue={content?.whyTitle ?? "Why Hercules Factory"}
                name="whyTitle"
                required
              />
            </Field>
            <Field label="Classes title">
              <Input
                defaultValue={content?.classesTitle ?? "Classes"}
                name="classesTitle"
                required
              />
            </Field>
            <Field label="Gallery title">
              <Input
                defaultValue={content?.galleryTitle ?? "Gallery / Training"}
                name="galleryTitle"
                required
              />
            </Field>
            <Field label="Reviews title">
              <Input
                defaultValue={content?.testimonialsTitle ?? "What members say"}
                name="testimonialsTitle"
                required
              />
            </Field>
            <Field label="FAQ title">
              <Input
                defaultValue={content?.faqTitle ?? "FAQ"}
                name="faqTitle"
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2" id="location">
            <Field label="Location title">
              <Input
                defaultValue={content?.locationTitle ?? "Find us"}
                name="locationTitle"
                required
              />
            </Field>
            <Field label="Location address">
              <Input
                defaultValue={content?.locationAddress ?? ""}
                name="locationAddress"
                required
              />
            </Field>
          </div>
          <Field label="Map embed URL">
            <Input
              defaultValue={content?.mapEmbedUrl ?? ""}
              name="mapEmbedUrl"
            />
          </Field>
          <Button disabled={saveContent.isPending} type="submit">
            {saveContent.isPending ? "Saving…" : "Save landing content"}
          </Button>
        </form>
      </Card>

      <SectionHeader id="why" title="Why Hercules Factory" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.why.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border border-stone-100 px-3 py-2"
            >
              <span>
                <span className="font-semibold">
                  {item.emoji} {item.title}
                </span>
                <span className="block text-stone-500">
                  {item.description ?? "—"}
                </span>
              </span>
              <button
                onClick={() => deleteWhy.mutate({ id: item.id })}
                type="button"
              >
                <Trash2 className="size-4 text-red-700" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            createWhy.mutate({
              emoji: String(fd.get("emoji")),
              title: String(fd.get("title")),
              description: String(fd.get("description") ?? "") || undefined,
              sortOrder: data.why.length,
              isActive: true,
            });
            form.reset();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
            <Field label="Emoji">
              <Input name="emoji" required />
            </Field>
            <Field label="Title">
              <Input name="title" required />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              name="description"
              placeholder="One or two sentences — shown under the title on the landing page."
            />
          </Field>
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <SectionHeader id="classes" title="Classes" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.classes.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md border border-stone-100 px-3 py-2"
            >
              <span>
                <span className="font-semibold">{item.name}</span>{" "}
                <span className="text-stone-500">{item.description}</span>
              </span>
              <button
                onClick={() => deleteClass.mutate({ id: item.id })}
                type="button"
              >
                <Trash2 className="size-4 text-red-700" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            createClass.mutate({
              name: String(fd.get("name")),
              description: String(fd.get("description")),
              imageUrl: String(fd.get("imageUrl") ?? "") || undefined,
              whatsappMessage:
                String(fd.get("whatsappMessage") ?? "") || undefined,
              sortOrder: data.classes.length,
              isActive: true,
            });
            form.reset();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input name="name" placeholder="GROUP CLASS" required />
            </Field>
            <Field label="Description">
              <Input name="description" required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image URL">
              <Input name="imageUrl" />
            </Field>
            <Field label="WhatsApp message">
              <Input name="whatsappMessage" />
            </Field>
          </div>
          <Button type="submit">Add class</Button>
        </form>
      </Card>

      <SectionHeader
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

      <SectionHeader id="gallery" title="Gallery" />
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
                <button
                  onClick={() => deleteGallery.mutate({ id: image.id })}
                  type="button"
                >
                  <Trash2 className="size-4 text-red-700" />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            const file = fd.get("imageFile") as File | null;

            const add = (imageUrl: string) => {
              createGallery.mutate({
                imageUrl,
                alt: String(fd.get("alt")),
                category: String(fd.get("category") ?? "") || undefined,
                sortOrder: data.gallery.length,
                isActive: true,
              });
              form.reset();
            };

            if (file && file.size > 0) {
              const uploadData = new FormData();
              uploadData.set("imageFile", file);
              uploadData.set("prefix", "gallery");
              startUpload(async () => {
                try {
                  add(await uploadImageAction(uploadData));
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Upload failed",
                  );
                }
              });
              return;
            }

            if (!galleryUrl) {
              toast.error("Upload a file or paste an image URL.");
              return;
            }
            add(galleryUrl);
          }}
        >
          <ImageFileUpload name="imageFile" />
          <Field label="…or paste an image URL">
            <Input
              onChange={(e) => setGalleryUrl(e.target.value)}
              value={galleryUrl}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alt text">
              <Input name="alt" required />
            </Field>
            <Field label="Category">
              <Input
                name="category"
                placeholder="Group class / PT / Sparring"
              />
            </Field>
          </div>
          <Button disabled={uploading || createGallery.isPending} type="submit">
            {uploading ? "Uploading…" : "Add image"}
          </Button>
        </form>
      </Card>

      <SectionHeader id="reviews" title="Reviews" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.reviews.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border border-stone-100 px-3 py-2"
            >
              <span>
                <span className="font-semibold">{item.author}</span>{" "}
                <Badge>
                  {item.rating}★ {item.source}
                  {item.reviewedAt ? ` · ${item.reviewedAt}` : ""}
                </Badge>
                <span className="block text-stone-500">{item.quote}</span>
              </span>
              <button
                onClick={() => deleteReview.mutate({ id: item.id })}
                type="button"
              >
                <Trash2 className="size-4 text-red-700" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            createReview.mutate({
              author: String(fd.get("author")),
              rating: Number(fd.get("rating")),
              quote: String(fd.get("quote")),
              source: String(fd.get("source")) || "Google",
              reviewedAt: String(fd.get("reviewedAt") ?? "") || undefined,
              sortOrder: data.reviews.length,
              isActive: true,
            });
            form.reset();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <Field label="Author">
              <Input name="author" required />
            </Field>
            <Field label="Rating">
              <Input
                defaultValue={5}
                max={5}
                min={1}
                name="rating"
                required
                type="number"
              />
            </Field>
            <Field label="Source">
              <Input defaultValue="Google" name="source" required />
            </Field>
            <Field label="Reviewed">
              <Input name="reviewedAt" placeholder="Jun 2026" />
            </Field>
          </div>
          <Field label="Quote">
            <Textarea name="quote" required />
          </Field>
          <Button type="submit">Add review</Button>
        </form>
      </Card>

      <SectionHeader id="faq" title="FAQ" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.faq.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border border-stone-100 px-3 py-2"
            >
              <span>
                <span className="font-semibold">{item.question}</span>
                <span className="block text-stone-500">{item.answer}</span>
              </span>
              <button
                onClick={() => deleteFaq.mutate({ id: item.id })}
                type="button"
              >
                <Trash2 className="size-4 text-red-700" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            createFaq.mutate({
              question: String(fd.get("question")),
              answer: String(fd.get("answer")),
              sortOrder: data.faq.length,
              isActive: true,
            });
            form.reset();
          }}
        >
          <Field label="Question">
            <Input name="question" required />
          </Field>
          <Field label="Answer">
            <Textarea name="answer" required />
          </Field>
          <Button type="submit">Add FAQ</Button>
        </form>
      </Card>

      <SectionHeader id="social" title="Social links" />
      <Card>
        <ul className="mb-4 grid gap-2">
          {data.social.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md border border-stone-100 px-3 py-2"
            >
              <span className="font-semibold">
                {item.label}{" "}
                <span className="font-normal text-stone-500">{item.url}</span>
              </span>
              <button
                onClick={() => deleteSocial.mutate({ id: item.id })}
                type="button"
              >
                <Trash2 className="size-4 text-red-700" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            createSocial.mutate({
              platform: String(fd.get("platform")),
              label: String(fd.get("label")),
              url: String(fd.get("url")),
              sortOrder: data.social.length,
              isActive: true,
            });
            form.reset();
          }}
        >
          <Field label="Platform">
            <Input name="platform" placeholder="instagram" required />
          </Field>
          <Field label="Label">
            <Input name="label" placeholder="Instagram" required />
          </Field>
          <Field label="URL">
            <Input name="url" required />
          </Field>
          <Button type="submit">Add</Button>
        </form>
      </Card>
    </>
  );
}
