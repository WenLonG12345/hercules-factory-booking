"use client";

import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { TRANSLATABLE } from "@/server/validators/cms";
import { centsToRinggit, ringgitToCents } from "../admin-format";
import {
  AddClassDialog,
  AddPricingDialog,
  AddWhyDialog,
  ImageField,
  PricingFields,
  useImageUpload,
} from "./add-dialogs";
import { type CmsData, EditRow, SectionHeader, useCmsToast } from "./cms-ui";
import { readZh, ZhFields } from "./zh-fields";

/** What the gym sells: the pillars, the classes, and the rate card. */
export function OfferingPanel({ data }: { data: CmsData }) {
  const { onError, onSuccess } = useCmsToast();
  const { uploading, withImage } = useImageUpload("icon", "why-icons");
  const classImage = useImageUpload("image", "classes");

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
  const updatePricing = api.cms.pricing.update.useMutation({
    onSuccess: onSuccess("Plan saved."),
    onError,
  });
  const deletePricing = api.cms.pricing.delete.useMutation({
    onSuccess: onSuccess("Plan removed."),
    onError,
  });

  return (
    <>
      <SectionHeader
        hint="The reasons-to-train grid under the hero."
        id="why"
        title="Why Hercules Factory"
      />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.why.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deleteWhy.mutate({ id: item.id })}
              onSubmit={(fd) =>
                withImage(fd, (iconUrl) =>
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
              <ImageField
                base="icon"
                hint="optional; the row is numbered when this is empty"
                label="Icon"
                previewClassName="aspect-video w-full bg-stone-50 object-contain p-3"
                url={item.iconUrl}
              />
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

      <SectionHeader
        hint="One card per class, with the photo and the WhatsApp message its Enquire button sends."
        id="classes"
        title="Classes"
      />
      <Card className="mb-8">
        <ul className="mb-4 grid gap-2">
          {data.classes.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deleteClass.mutate({ id: item.id })}
              onSubmit={(fd) =>
                classImage.withImage(fd, (imageUrl) =>
                  updateClass.mutate({
                    id: item.id,
                    name: String(fd.get("name")),
                    description: String(fd.get("description")),
                    imageUrl,
                    whatsappMessage:
                      String(fd.get("whatsappMessage") ?? "") || undefined,
                    sortOrder: index,
                    isActive: item.isActive,
                    zh: readZh(fd),
                  }),
                )
              }
              pending={classImage.uploading || updateClass.isPending}
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
              <ImageField
                base="image"
                label="Class photo"
                url={item.imageUrl}
              />
              <Field label="WhatsApp message">
                <Input
                  defaultValue={item.whatsappMessage ?? ""}
                  name="whatsappMessage"
                />
              </Field>
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
        hint="Rows render as the ruled rate card. Tick “Highlight” on exactly one plan — that one is lifted out of the list and runs as the centred red trial band underneath it: name as the headline, feature line one as the tagline, then the price and the remaining lines."
        id="pricing"
        title="Pricing"
      />
      <Card>
        <ul className="mb-4 grid gap-2">
          {data.pricing.map((item, index) => (
            <EditRow
              key={item.id}
              onDelete={() => deletePricing.mutate({ id: item.id })}
              onSubmit={(fd) =>
                updatePricing.mutate({
                  id: item.id,
                  name: String(fd.get("name")),
                  priceCents: ringgitToCents(fd.get("price")),
                  unit: String(fd.get("unit") ?? "") || undefined,
                  features: String(fd.get("features") ?? "") || undefined,
                  highlight: fd.get("highlight") === "on",
                  whatsappMessage:
                    String(fd.get("whatsappMessage") ?? "") || undefined,
                  sortOrder: index,
                  isActive: item.isActive,
                  zh: readZh(fd),
                })
              }
              pending={updatePricing.isPending}
              subtitle={item.features?.split("\n").join(" · ")}
              summary={`${item.name} — RM${centsToRinggit(item.priceCents)}${
                item.unit ? ` / ${item.unit}` : ""
              }${item.highlight ? "  ★ highlighted" : ""}`}
            >
              <PricingFields plan={item} />
            </EditRow>
          ))}
        </ul>
        <AddPricingDialog sortOrder={data.pricing.length} />
      </Card>
    </>
  );
}
