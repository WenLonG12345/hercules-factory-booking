"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { TRANSLATABLE } from "@/server/validators/cms";
import {
  AddClassDialog,
  AddFaqDialog,
  AddGalleryDialog,
  AddReviewDialog,
  AddSocialDialog,
  AddWhyDialog,
  IconField,
  useIconUpload,
} from "./add-dialogs";
import { readZh, ZhFields } from "./zh-fields";

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

/**
 * An existing CMS row, collapsed behind a native `<details>`. Before this the
 * lists were delete-only, so a typo — or a missing translation — meant deleting
 * the row and typing it again.
 */
function EditRow({
  summary,
  subtitle,
  onSubmit,
  onDelete,
  pending,
  children,
}: {
  summary: string;
  subtitle?: string | null;
  onSubmit: (formData: FormData) => void;
  onDelete: () => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-md border border-stone-100">
      <details>
        <summary className="cursor-pointer px-3 py-2">
          <span className="font-semibold">{summary}</span>
          <span className="block text-stone-500">{subtitle ?? "—"}</span>
        </summary>
        <form
          className="grid gap-4 border-t border-stone-100 px-3 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {children}
          <div className="flex gap-2">
            <Button disabled={pending} type="submit">
              Save
            </Button>
            <Button onClick={onDelete} type="button" variant="quiet">
              <Trash2 className="size-4 text-red-700" />
            </Button>
          </div>
        </form>
      </details>
    </li>
  );
}

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h2 className="mb-3 scroll-mt-24 text-xl font-black" id={id}>
      {title}
    </h2>
  );
}

export default function CmsPage() {
  const utils = api.useUtils();
  const { uploading, withIcon } = useIconUpload();

  const { data, isLoading } = api.cms.allContent.useQuery();

  const onError = (error: { message: string }) => toast.error(error.message);
  const onSuccess = (message: string) => () => {
    toast.success(message);
    utils.cms.allContent.invalidate();
    utils.cms.publicContent.invalidate();
  };

  const saveContent = api.cms.updateLandingContent.useMutation({
    onSuccess: onSuccess("Landing content saved."),
    onError,
  });
  const updateWhy = api.cms.why.update.useMutation({
    onSuccess: onSuccess("Pillar saved."),
    onError,
  });
  const deleteWhy = api.cms.why.delete.useMutation({
    onSuccess: onSuccess("Pillar removed."),
    onError,
  });
  const updateClass = api.cms.classes.update.useMutation({
    onSuccess: onSuccess("Class saved."),
    onError,
  });
  const deleteClass = api.cms.classes.delete.useMutation({
    onSuccess: onSuccess("Class removed."),
    onError,
  });
  const updateFaq = api.cms.faq.update.useMutation({
    onSuccess: onSuccess("FAQ saved."),
    onError,
  });
  const deleteFaq = api.cms.faq.delete.useMutation({
    onSuccess: onSuccess("FAQ removed."),
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
  const deleteReview = api.cms.reviews.delete.useMutation({
    onSuccess: onSuccess("Review removed."),
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
              zh: readZh(fd),
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
          <ZhFields
            fields={TRANSLATABLE.content}
            multiline={["whatsappMessage", "locationAddress"]}
            value={content?.zh}
          />
          <Button disabled={saveContent.isPending} type="submit">
            {saveContent.isPending ? "Saving…" : "Save landing content"}
          </Button>
        </form>
      </Card>

      <SectionHeader id="why" title="Why Hercules Factory" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.why.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deleteWhy.mutate({ id: item.id })}
              onSubmit={(fd) =>
                withIcon(fd, (iconUrl) =>
                  updateWhy.mutate({
                    id: item.id,
                    emoji: String(fd.get("emoji")),
                    iconUrl,
                    title: String(fd.get("title")),
                    description:
                      String(fd.get("description") ?? "") || undefined,
                    sortOrder: index,
                    isActive: item.isActive,
                    zh: readZh(fd),
                  }),
                )
              }
              pending={uploading || updateWhy.isPending}
              subtitle={item.description}
              summary={`${item.emoji} ${item.title}`}
            >
              <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
                <Field label="Emoji">
                  <Input defaultValue={item.emoji} name="emoji" required />
                </Field>
                <Field label="Title">
                  <Input defaultValue={item.title} name="title" required />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  defaultValue={item.description ?? ""}
                  name="description"
                />
              </Field>
              <IconField iconUrl={item.iconUrl} />
              <ZhFields
                fields={TRANSLATABLE.why}
                multiline={["description"]}
                value={item.zh}
              />
            </EditRow>
          ))}
        </ul>
        <AddWhyDialog sortOrder={data.why.length} />
      </Card>

      <SectionHeader id="classes" title="Classes" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.classes.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deleteClass.mutate({ id: item.id })}
              onSubmit={(fd) =>
                updateClass.mutate({
                  id: item.id,
                  name: String(fd.get("name")),
                  description: String(fd.get("description")),
                  imageUrl: String(fd.get("imageUrl") ?? "") || undefined,
                  whatsappMessage:
                    String(fd.get("whatsappMessage") ?? "") || undefined,
                  sortOrder: index,
                  isActive: item.isActive,
                  zh: readZh(fd),
                })
              }
              pending={updateClass.isPending}
              subtitle={item.description}
              summary={item.name}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input defaultValue={item.name} name="name" required />
                </Field>
                <Field label="Description">
                  <Input
                    defaultValue={item.description}
                    name="description"
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Image URL">
                  <Input defaultValue={item.imageUrl ?? ""} name="imageUrl" />
                </Field>
                <Field label="WhatsApp message">
                  <Input
                    defaultValue={item.whatsappMessage ?? ""}
                    name="whatsappMessage"
                  />
                </Field>
              </div>
              <ZhFields
                fields={TRANSLATABLE.classes}
                multiline={["description", "whatsappMessage"]}
                value={item.zh}
              />
            </EditRow>
          ))}
        </ul>
        <AddClassDialog sortOrder={data.classes.length} />
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

        <AddGalleryDialog sortOrder={data.gallery.length} />
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
        <AddReviewDialog sortOrder={data.reviews.length} />
      </Card>

      <SectionHeader id="faq" title="FAQ" />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.faq.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deleteFaq.mutate({ id: item.id })}
              onSubmit={(fd) =>
                updateFaq.mutate({
                  id: item.id,
                  question: String(fd.get("question")),
                  answer: String(fd.get("answer")),
                  sortOrder: index,
                  isActive: item.isActive,
                  zh: readZh(fd),
                })
              }
              pending={updateFaq.isPending}
              subtitle={item.answer}
              summary={item.question}
            >
              <Field label="Question">
                <Input defaultValue={item.question} name="question" required />
              </Field>
              <Field label="Answer">
                <Textarea defaultValue={item.answer} name="answer" required />
              </Field>
              <ZhFields
                fields={TRANSLATABLE.faq}
                multiline={["answer"]}
                value={item.zh}
              />
            </EditRow>
          ))}
        </ul>
        <AddFaqDialog sortOrder={data.faq.length} />
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
        <AddSocialDialog sortOrder={data.social.length} />
      </Card>
    </>
  );
}
