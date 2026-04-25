import {
  createCoachAction,
  createGalleryImageAction,
  createSocialLinkAction,
  createTestimonialAction,
  updateLandingContentAction,
} from "@/app/admin/(portal)/actions";
import { PageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { getLandingData } from "@/server/services/queries";

export default async function CmsPage() {
  const data = await getLandingData();
  const content = data.content;

  return (
    <>
      <PageHeader eyebrow="Content" title="Landing page CMS" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-black">Hero and about content</h2>
          <form action={updateLandingContentAction} className="grid gap-4">
            <Field label="Hero title">
              <Input name="heroTitle" defaultValue={content?.heroTitle} />
            </Field>
            <Field label="Hero subtitle">
              <Textarea
                name="heroSubtitle"
                defaultValue={content?.heroSubtitle}
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Primary CTA">
                <Input
                  name="primaryCtaText"
                  defaultValue={content?.primaryCtaText}
                />
              </Field>
              <Field label="Secondary CTA">
                <Input
                  name="secondaryCtaText"
                  defaultValue={content?.secondaryCtaText}
                />
              </Field>
            </div>
            <Field label="About title">
              <Input name="aboutTitle" defaultValue={content?.aboutTitle} />
            </Field>
            <Field label="About body">
              <Textarea name="aboutBody" defaultValue={content?.aboutBody} />
            </Field>
            <Field label="Location title">
              <Input
                name="locationTitle"
                defaultValue={content?.locationTitle}
              />
            </Field>
            <Field label="Location address">
              <Input
                name="locationAddress"
                defaultValue={content?.locationAddress}
              />
            </Field>
            <Field label="Map embed URL">
              <Input
                name="mapEmbedUrl"
                defaultValue={content?.mapEmbedUrl ?? ""}
              />
            </Field>
            <Button type="submit">Save content</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-black">Add gallery image</h2>
            <form action={createGalleryImageAction} className="grid gap-3">
              <Input name="imageUrl" placeholder="Image URL" />
              <Input name="alt" placeholder="Alt text" />
              <Input name="caption" placeholder="Caption" />
              <Input name="sortOrder" placeholder="Sort order" type="number" />
              <Button type="submit">Add image</Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-black">Add coach</h2>
            <form action={createCoachAction} className="grid gap-3">
              <Input name="name" placeholder="Name" />
              <Input name="title" placeholder="Title" />
              <Textarea name="bio" placeholder="Bio" />
              <Input name="imageUrl" placeholder="Image URL" />
              <Button type="submit">Add coach</Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-black">Add testimonial</h2>
            <form action={createTestimonialAction} className="grid gap-3">
              <Input name="customerName" placeholder="Customer name" />
              <Textarea name="quote" placeholder="Quote" />
              <Input defaultValue="5" name="rating" type="number" />
              <Button type="submit">Add testimonial</Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-lg font-black">Add social link</h2>
            <form action={createSocialLinkAction} className="grid gap-3">
              <Input name="platform" placeholder="Platform" />
              <Input name="label" placeholder="Label" />
              <Input name="url" placeholder="URL" />
              <Button type="submit">Add link</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
