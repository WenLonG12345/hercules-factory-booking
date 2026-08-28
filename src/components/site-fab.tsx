"use client";

import { Camera, Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
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

/**
 * One pill per speed-dial action: label on the left, a round mark on the
 * right that carries the action's own colour — accent for ours, the brand's
 * own for WhatsApp and Google. `whitespace-nowrap` keeps every label on one
 * line down to a 320px viewport.
 */
const ACTION =
  "lift flex items-center gap-3 whitespace-nowrap rounded-full bg-paper-2 py-2.5 pl-5 pr-2.5 text-xs font-black uppercase tracking-[0.14em] shadow-lg ring-1 ring-hairline active:translate-y-0";

/** Speed-dial FAB: WhatsApp the gym, leave a review, or send in a photo. */
export function SiteFab({
  googleReviewHref,
  whatsappHref,
}: {
  googleReviewHref?: string;
  whatsappHref: string;
}) {
  const t = useTranslations("Fab");
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
            className={ACTION}
            onClick={() => {
              setOpen(false);
              setSent(false);
              setError(null);
              setDialogOpen(true);
            }}
            type="button"
          >
            {t("sharePhoto")}
            <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink">
              <Camera className="size-5" />
            </span>
          </button>

          {googleReviewHref ? (
            <a
              className={ACTION}
              href={googleReviewHref}
              rel="noreferrer"
              target="_blank"
            >
              {t("googleReview")}
              <span className="grid size-10 place-items-center rounded-full bg-paper ring-1 ring-hairline">
                <FcGoogle className="size-5" />
              </span>
            </a>
          ) : null}

          <a
            className={ACTION}
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            {t("whatsapp")}
            <span className="grid size-10 place-items-center rounded-full bg-[#25D366] text-stone-950">
              <FaWhatsapp className="size-5" />
            </span>
          </a>
        </div>

        <button
          aria-expanded={open}
          aria-label={open ? t("close") : t("open")}
          className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-fab transition hover:brightness-110"
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
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="grid justify-items-center gap-3 py-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-green-100 text-green-700">
                <Check className="size-6" />
              </span>
              <p className="font-semibold">{t("sentTitle")}</p>
              <p className="text-sm text-stone-600">{t("sentBody")}</p>
              <Button
                className="mt-2"
                onClick={() => setDialogOpen(false)}
                variant="quiet"
              >
                {t("closeButton")}
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
                <Field label={t("yourName")}>
                  <Input maxLength={40} name="name" required />
                </Field>
                <Field label={t("caption")}>
                  <Input
                    maxLength={80}
                    name="caption"
                    placeholder={t("captionPlaceholder")}
                  />
                </Field>
              </div>
              {error ? (
                <p className="text-sm font-semibold text-red-700">{error}</p>
              ) : null}
              <Button disabled={pending} type="submit">
                {pending ? t("sending") : t("send")}
              </Button>
              <p className="text-xs text-stone-500">{t("consent")}</p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
