"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadImageAction } from "@/app/admin/(portal)/actions";
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
 * 3D icon for a Why pillar. Left empty, the landing page keeps rendering the
 * emoji — the same lit disc and float animation wrap either one.
 */
export function IconField({ iconUrl }: { iconUrl?: string | null }) {
  return (
    <div className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
      <span className="text-sm font-semibold text-stone-700">
        3D icon{" "}
        <span className="font-normal text-stone-500">
          — optional; the emoji is shown when this is empty
        </span>
      </span>
      {iconUrl ? (
        // biome-ignore lint/performance/noImgElement: admin preview only
        <img alt="" className="size-12 object-contain" src={iconUrl} />
      ) : null}
      <ImageFileUpload name="iconFile" />
      <Field label="…or paste an icon URL">
        <Input defaultValue={iconUrl ?? ""} name="iconUrl" />
      </Field>
    </div>
  );
}

/** Uploads the picked 3D icon (if any) to R2, then runs the mutation. */
export function useIconUpload() {
  const [uploading, startUpload] = useTransition();
  const withIcon = (fd: FormData, next: (iconUrl?: string) => void) => {
    const file = fd.get("iconFile") as File | null;
    if (!file || file.size === 0) {
      next(String(fd.get("iconUrl") ?? "") || undefined);
      return;
    }
    const upload = new FormData();
    upload.set("imageFile", file);
    upload.set("prefix", "why-icons");
    startUpload(async () => {
      try {
        next(await uploadImageAction(upload));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  };
  return { uploading, withIcon };
}

export function AddWhyDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Pillar added.");
  const create = api.cms.why.create.useMutation(options);
  const { uploading, withIcon } = useIconUpload();

  return (
    <Shell
      label="Add pillar"
      onSubmit={(fd) =>
        withIcon(fd, (iconUrl) =>
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
      <IconField />
      <ZhFields fields={TRANSLATABLE.why} multiline={["description"]} />
    </Shell>
  );
}

export function AddClassDialog({ sortOrder }: { sortOrder: number }) {
  const { open, setOpen, options } = useCreateDialog("Class added.");
  const create = api.cms.classes.create.useMutation(options);

  return (
    <Shell
      label="Add class"
      onSubmit={(fd) =>
        create.mutate({
          name: String(fd.get("name")),
          description: String(fd.get("description")),
          imageUrl: String(fd.get("imageUrl") ?? "") || undefined,
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
      <ZhFields
        fields={TRANSLATABLE.classes}
        multiline={["description", "whatsappMessage"]}
      />
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
            alt: String(fd.get("alt")),
            category: String(fd.get("category") ?? "") || undefined,
            sortOrder,
            isActive: true,
          });

        const file = fd.get("imageFile") as File | null;
        if (file && file.size > 0) {
          const upload = new FormData();
          upload.set("imageFile", file);
          upload.set("prefix", "gallery");
          startUpload(async () => {
            try {
              add(await uploadImageAction(upload));
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Upload failed",
              );
            }
          });
          return;
        }

        const imageUrl = String(fd.get("imageUrl") ?? "");
        if (!imageUrl) {
          toast.error("Upload a file or paste an image URL.");
          return;
        }
        add(imageUrl);
      }}
      open={open}
      pending={uploading || create.isPending}
      setOpen={setOpen}
      submitLabel={uploading ? "Uploading…" : "Add photo"}
    >
      <ImageFileUpload name="imageFile" />
      <Field label="…or paste an image URL">
        <Input name="imageUrl" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alt text">
          <Input name="alt" required />
        </Field>
        <Field label="Category">
          <Input name="category" placeholder="Group class / PT / Sparring" />
        </Field>
      </div>
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
