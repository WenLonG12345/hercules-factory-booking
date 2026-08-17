"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { TRANSLATABLE } from "@/server/validators/cms";
import { AddSocialDialog } from "./add-dialogs";
import {
  type CmsData,
  DeleteButton,
  SectionHeader,
  useCmsToast,
} from "./cms-ui";
import { readZh, ZhFields } from "./zh-fields";

/**
 * Everything that exists exactly once on the landing page: the hero, the
 * WhatsApp details every CTA links to, the heading over each section, the
 * address, and the social row in the footer.
 */
export function SitePanel({ data }: { data: CmsData }) {
  const { onError, onSuccess } = useCmsToast();
  const content = data.content;

  const saveContent = api.cms.updateLandingContent.useMutation({
    onSuccess: onSuccess("Landing content saved."),
    onError,
  });
  const deleteSocial = api.cms.social.delete.useMutation({
    onSuccess: onSuccess("Link removed."),
    onError,
  });

  return (
    <>
      <SectionHeader
        hint="The hero, the WhatsApp number behind every button, and the heading over each section of the page."
        id="hero"
        title="Hero, WhatsApp & section titles"
      />
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
              pricingTitle: String(fd.get("pricingTitle")),
              promotionsTitle: String(fd.get("promotionsTitle")),
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
              placeholder="Upload under Media, then paste the URL"
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

          <fieldset className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="px-1 text-sm font-semibold text-stone-700">
              Section headings
            </legend>
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
            <Field label="Pricing title">
              <Input
                defaultValue={content?.pricingTitle ?? "Pricing"}
                name="pricingTitle"
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
            <Field label="Promotions title">
              <Input
                defaultValue={content?.promotionsTitle ?? "Promotions"}
                name="promotionsTitle"
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
          </fieldset>

          <fieldset
            className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2"
            id="location"
          >
            <legend className="px-1 text-sm font-semibold text-stone-700">
              Location
            </legend>
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
            <Field className="sm:col-span-2" label="Map embed URL">
              <Input
                defaultValue={content?.mapEmbedUrl ?? ""}
                name="mapEmbedUrl"
              />
            </Field>
          </fieldset>

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

      <SectionHeader
        hint="The row of links in the site footer."
        id="social"
        title="Social links"
      />
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
              <DeleteButton
                onClick={() => deleteSocial.mutate({ id: item.id })}
              />
            </li>
          ))}
        </ul>
        <AddSocialDialog sortOrder={data.social.length} />
      </Card>
    </>
  );
}
