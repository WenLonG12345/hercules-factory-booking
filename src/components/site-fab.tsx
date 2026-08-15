"use client";

import { Camera, Check, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { submitPhotoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageFileUpload } from "@/components/ui/file-upload";
import { Field, Input } from "@/components/ui/form";

/** Speed-dial FAB: WhatsApp the gym, or send in a training photo. */
export function SiteFab({ whatsappHref }: { whatsappHref: string }) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <button
            className="lift flex items-center gap-3 rounded-full bg-paper-2 py-2.5 pl-5 pr-2.5 text-xs font-black uppercase tracking-[0.14em] shadow-lg ring-1 ring-hairline"
            onClick={() => {
              setOpen(false);
              setSent(false);
              setError(null);
              setDialogOpen(true);
            }}
            type="button"
          >
            Share your photo
            <span className="grid size-10 place-items-center rounded-full bg-accent-2 text-stone-950">
              <Camera className="size-5" />
            </span>
          </button>

          <a
            className="lift flex items-center gap-3 rounded-full bg-paper-2 py-2.5 pl-5 pr-2.5 text-xs font-black uppercase tracking-[0.14em] shadow-lg ring-1 ring-hairline"
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp us
            <span className="grid size-10 place-items-center rounded-full bg-[#25D366] text-stone-950">
              <FaWhatsapp className="size-5" />
            </span>
          </a>
        </div>

        <button
          aria-expanded={open}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          className="grid size-14 place-items-center rounded-full bg-accent shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition hover:brightness-110"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Plus
            className={`size-7 transition-transform duration-200 ${
              open ? "rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your Muay Thai photo</DialogTitle>
            <DialogDescription>
              Trained with us? Send a photo — once we approve it, it goes up in
              the gallery on this page.
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="grid justify-items-center gap-3 py-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-green-100 text-green-700">
                <Check className="size-6" />
              </span>
              <p className="font-semibold">Got it — thank you!</p>
              <p className="text-sm text-stone-600">
                We&apos;ll review your photo before it appears in the gallery.
              </p>
              <Button
                className="mt-2"
                onClick={() => setDialogOpen(false)}
                variant="quiet"
              >
                Close
              </Button>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                setError(null);
                startSubmit(async () => {
                  const result = await submitPhotoAction(formData);
                  if (result.error) setError(result.error);
                  else setSent(true);
                });
              }}
            >
              <ImageFileUpload name="photo" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name">
                  <Input maxLength={40} name="name" required />
                </Field>
                <Field label="Caption (optional)">
                  <Input
                    maxLength={80}
                    name="caption"
                    placeholder="First class done!"
                  />
                </Field>
              </div>
              {error ? (
                <p className="text-sm font-semibold text-red-700">{error}</p>
              ) : null}
              <Button disabled={pending} type="submit">
                {pending ? "Sending…" : "Send photo"}
              </Button>
              <p className="text-xs text-stone-500">
                By sending a photo you let Hercules Factory show it on this
                website. JPG, PNG or WEBP up to 8 MB.
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
