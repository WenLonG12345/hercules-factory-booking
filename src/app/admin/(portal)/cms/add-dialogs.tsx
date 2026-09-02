"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadImageAction } from "@/app/admin/(portal)/actions";
import {
  centsToRinggit,
  ringgitToCents,
} from "@/app/admin/(portal)/admin-format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageFileUpload } from "@/components/ui/file-upload";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { TRANSLATABLE } from "@/server/validators/cms";
import { readZh, ZhFields } from "./zh-fields";

/**
 * Open state + the mutation options every create shares: toast, close, and
 * refresh both the admin list and the public landing query.
 */
function useCreateDialog(message: string) {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    options: {
      onSuccess: () => {
        toast.success(message);
        setOpen(false);
        utils.cms.allContent.invalidate();
        utils.cms.publicContent.invalidate();
      },
      onError: (error: { message: string }) => toast.error(error.message),
    },
  };
}

/**
 * "Add …" trigger plus the create form. Radix unmounts the content on close,
 * so the form resets itself — no `form.reset()` anywhere.
 */
function Shell({
  label,
  open,
  setOpen,
  pending,
  submitLabel,
  onSubmit,
  children,
}: {
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  submitLabel?: string;
  onSubmit: (fd: FormData) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {children}
          <Button disabled={pending} type="submit">
            {submitLabel ?? label}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Upload picker for one image field. `base` names both inputs: `${base}File`
 * for the file, and a hidden `${base}Url` carrying the image already saved on
 * the row — so saving without picking a new file keeps the current image, and
 * "Remove" clears it.
 */
export function ImageField({
  base,
  label,
  hint,
  url,
  previewClassName,
}: {
  base: string;
  label: string;
  hint?: string;
  url?: string | null;
  previewClassName?: string;
}) {
  const [current, setCurrent] = useState(url ?? "");

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        {hint ? <span className="text-xs text-stone-500">{hint}</span> : null}
      </div>
      <input name={`${base}Url`} type="hidden" value={current} />
      <ImageFileUpload
        className="max-w-md"
        initialPreview={current || null}
        name={`${base}File`}
        onClear={() => setCurrent("")}
        previewClassName={previewClassName}
      />
    </div>
  );
}

/**
 * Uploads the picked file (if any) to R2, then runs the mutation with the
 * resulting URL — falling back to the image already on the row.
 */
export function useImageUpload(base: string, prefix: string) {
  const [uploading, startUpload] = useTransition();
  const withImage = (fd: FormData, next: (url?: string) => void) => {
    const file = fd.get(`${base}File`) as File | null;
    if (!file || file.size === 0) {
      next(String(fd.get(`${base}Url`) ?? "") || undefined);
      return;
    }
    const upload = new FormData();
    upload.set("imageFile", file);
    upload.set("prefix", prefix);
    startUpload(async () => {
      const result = await uploadImageAction(upload);
      if (result.url) next(result.url);
      else toast.error(result.error ?? "Upload failed.");
    });
  };
  return { uploading, withImage };
}

export function AddWhyDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Pillar added.");
  const create = api.cms.why.create.useMutation(options);
  const { uploading, withImage } = useImageUpload("icon", "why-icons");

  return (
    <Shell
      label="Add pillar"
      onSubmit={(fd) =>
        withImage(fd, (iconUrl) =>
          create.mutate({
            emoji: String(fd.get("emoji")),
            iconUrl,
            title: String(fd.get("title")),
            description: String(fd.get("description") ?? "") || undefined,
            sortOrder,
            isActive: true,
            zh: readZh(fd),
          }),
        )
      }
      open={open}
      pending={uploading || create.isPending}
      setOpen={setOpen}
      submitLabel={uploading ? "Uploading…" : "Add pillar"}
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
      <ImageField
        base="icon"
        hint="optional; the row is numbered when this is empty"
        label="Icon"
        previewClassName="aspect-video w-full bg-stone-50 object-contain p-3"
      />
      <ZhFields fields={TRANSLATABLE.why} multiline={["description"]} />
    </Shell>
  );
}

export function AddClassDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Class added.");
  const create = api.cms.classes.create.useMutation(options);
  const { uploading, withImage } = useImageUpload("image", "classes");

  return (
    <Shell
      label="Add class"
      onSubmit={(fd) =>
        withImage(fd, (imageUrl) =>
          create.mutate({
            name: String(fd.get("name")),
            description: String(fd.get("description")),
            imageUrl,
            whatsappMessage:
              String(fd.get("whatsappMessage") ?? "") || undefined,
            sortOrder,
            isActive: true,
            zh: readZh(fd),
          }),
        )
      }
      open={open}
      pending={uploading || create.isPending}
      setOpen={setOpen}
      submitLabel={uploading ? "Uploading…" : "Add class"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" placeholder="GROUP CLASS" required />
        </Field>
        <Field label="Description">
          <Input name="description" required />
        </Field>
      </div>
      <ImageField base="image" label="Class photo" />
      <Field label="WhatsApp message">
        <Input name="whatsappMessage" />
      </Field>
      <ZhFields
        fields={TRANSLATABLE.classes}
        multiline={["description", "whatsappMessage"]}
      />
    </Shell>
  );
}

/**
 * Shared by the add dialog and the edit row — the price is typed in ringgit and
 * stored in cents, and the features box is one line per bullet.
 */
export function PricingFields({
  plan,
}: {
  plan?: {
    name: string;
    priceCents: number;
    unit: string | null;
    features: string | null;
    highlight: boolean;
    whatsappMessage: string | null;
    zh: Record<string, string> | null;
  };
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_140px]">
        <Field label="Name">
          <Input
            defaultValue={plan?.name}
            name="name"
            placeholder="UNLIMITED PASS"
            required
          />
        </Field>
        <Field label="Price (RM)">
          <Input
            defaultValue={plan ? centsToRinggit(plan.priceCents) : ""}
            min={0}
            name="price"
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field label="Per">
          <Input
            defaultValue={plan?.unit ?? ""}
            name="unit"
            placeholder="month / class"
          />
        </Field>
      </div>
      <Field label="Features — one per line (highlighted plan: line one is the tagline, the rest print under the price)">
        <Textarea
          defaultValue={plan?.features ?? ""}
          name="features"
          placeholder={"No registration fee\nUnlimited group classes"}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp message">
          <Input
            defaultValue={plan?.whatsappMessage ?? ""}
            name="whatsappMessage"
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-stone-700">
          <input
            defaultChecked={plan?.highlight}
            name="highlight"
            type="checkbox"
          />
          Highlight — runs as the red band, not a ledger row
        </label>
      </div>
      <ZhFields
        fields={TRANSLATABLE.pricing}
        multiline={["features", "whatsappMessage"]}
        value={plan?.zh}
      />
    </>
  );
}

export function AddPricingDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Plan added.");
  const create = api.cms.pricing.create.useMutation(options);

  return (
    <Shell
      label="Add plan"
      onSubmit={(fd) =>
        create.mutate({
          name: String(fd.get("name")),
          priceCents: ringgitToCents(fd.get("price")),
          unit: String(fd.get("unit") ?? "") || undefined,
          features: String(fd.get("features") ?? "") || undefined,
          highlight: fd.get("highlight") === "on",
          whatsappMessage: String(fd.get("whatsappMessage") ?? "") || undefined,
          sortOrder,
          isActive: true,
          zh: readZh(fd),
        })
      }
      open={open}
      pending={create.isPending}
      setOpen={setOpen}
    >
      <PricingFields />
    </Shell>
  );
}

export function AddGalleryDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Image added.");
  const create = api.cms.gallery.create.useMutation(options);
  const [uploading, startUpload] = useTransition();

  return (
    <Shell
      label="Add photo"
      onSubmit={(fd) => {
        const add = (imageUrl: string) =>
          create.mutate({
            imageUrl,
            label: String(fd.get("label") ?? "") || undefined,
            sortOrder,
            isActive: true,
          });

        const file = fd.get("imageFile") as File | null;
        if (file && file.size > 0) {
          const upload = new FormData();
          upload.set("imageFile", file);
          upload.set("prefix", "gallery");
          startUpload(async () => {
            const result = await uploadImageAction(upload);
            if (result.url) add(result.url);
            else toast.error(result.error ?? "Upload failed.");
          });
          return;
        }

        toast.error("Choose an image to upload.");
      }}
      open={open}
      pending={uploading || create.isPending}
      setOpen={setOpen}
      submitLabel={uploading ? "Uploading…" : "Add photo"}
    >
      {/* Square preview because the landing page crops gallery photos square
          (every third one 4:5) — portrait uploads are fine, they get centred. */}
      <ImageFileUpload
        className="max-w-xs"
        name="imageFile"
        previewClassName="aspect-square w-full object-cover"
      />
      <Field label="Label">
        <Input name="label" placeholder="Group class / PT / Sparring" />
      </Field>
    </Shell>
  );
}

export function AddPromoDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Promotion added.");
  const create = api.cms.promos.create.useMutation(options);
  const [uploading, startUpload] = useTransition();

  return (
    <Shell
      label="Add promotion"
      onSubmit={(fd) => {
        const add = (imageUrl: string) =>
          create.mutate({
            imageUrl,
            title: String(fd.get("title")),
            whatsappMessage:
              String(fd.get("whatsappMessage") ?? "") || undefined,
            sortOrder,
            isActive: true,
          });

        const file = fd.get("imageFile") as File | null;
        if (file && file.size > 0) {
          const upload = new FormData();
          upload.set("imageFile", file);
          upload.set("prefix", "promotions");
          startUpload(async () => {
            const result = await uploadImageAction(upload);
            if (result.url) add(result.url);
            else toast.error(result.error ?? "Upload failed.");
          });
          return;
        }

        toast.error("Choose an image to upload.");
      }}
      open={open}
      pending={uploading || create.isPending}
      setOpen={setOpen}
      submitLabel={uploading ? "Uploading…" : "Add promotion"}
    >
      <p className="text-sm text-stone-500">
        Portrait artwork, 9:16 (1080×1920) — the same file you post as an
        Instagram story. Other ratios get cropped to fit.
      </p>
      <ImageFileUpload
        className="max-w-[220px]"
        name="imageFile"
        previewClassName="aspect-9/16 w-full object-cover"
      />
      <Field label="Title">
        <Input
          name="title"
          placeholder="Merdeka special — 10 classes RM350"
          required
        />
      </Field>
      <Field label="WhatsApp message">
        <Input
          name="whatsappMessage"
          placeholder="Hi! I'd like to claim the Merdeka special."
        />
      </Field>
    </Shell>
  );
}

export function AddReviewDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Review added.");
  const create = api.cms.reviews.create.useMutation(options);

  return (
    <Shell
      label="Add review"
      onSubmit={(fd) =>
        create.mutate({
          author: String(fd.get("author")),
          rating: Number(fd.get("rating")),
          quote: String(fd.get("quote")),
          source: String(fd.get("source")) || "Google",
          reviewedAt: String(fd.get("reviewedAt") ?? "") || undefined,
          sortOrder,
          isActive: true,
        })
      }
      open={open}
      pending={create.isPending}
      setOpen={setOpen}
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
    </Shell>
  );
}

export function AddFaqDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("FAQ added.");
  const create = api.cms.faq.create.useMutation(options);

  return (
    <Shell
      label="Add FAQ"
      onSubmit={(fd) =>
        create.mutate({
          question: String(fd.get("question")),
          answer: String(fd.get("answer")),
          sortOrder,
          isActive: true,
          zh: readZh(fd),
        })
      }
      open={open}
      pending={create.isPending}
      setOpen={setOpen}
    >
      <Field label="Question">
        <Input name="question" required />
      </Field>
      <Field label="Answer">
        <Textarea name="answer" required />
      </Field>
      <ZhFields fields={TRANSLATABLE.faq} multiline={["answer"]} />
    </Shell>
  );
}

export function AddSocialDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Link added.");
  const create = api.cms.social.create.useMutation(options);

  return (
    <Shell
      label="Add social link"
      onSubmit={(fd) =>
        create.mutate({
          platform: String(fd.get("platform")),
          label: String(fd.get("label")),
          url: String(fd.get("url")),
          sortOrder,
          isActive: true,
        })
      }
      open={open}
      pending={create.isPending}
      setOpen={setOpen}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Platform">
          <Input name="platform" placeholder="instagram" required />
        </Field>
        <Field label="Label">
          <Input name="label" placeholder="Instagram" required />
        </Field>
      </div>
      <Field label="URL">
        <Input name="url" required />
      </Field>
    </Shell>
  );
}
