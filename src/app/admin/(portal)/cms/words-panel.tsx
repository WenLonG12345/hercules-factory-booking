"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api } from "@/lib/trpc";
import { TRANSLATABLE } from "@/server/validators/cms";
import { AddFaqDialog, AddReviewDialog } from "./add-dialogs";
import {
  type CmsData,
  DeleteButton,
  EditRow,
  SectionHeader,
  useCmsToast,
} from "./cms-ui";
import { readZh, ZhFields } from "./zh-fields";

/** What other people said, and what people keep asking. */
export function WordsPanel({ data }: { data: CmsData }) {
  const { onError, onSuccess } = useCmsToast();

  const deleteReview = api.cms.reviews.delete.useMutation({
    onSuccess: onSuccess("Review removed."),
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

  return (
    <>
      <SectionHeader
        hint="Copied in from the Google Business Profile — these are real quotes, so they are not translated."
        id="reviews"
        title="Reviews"
      />
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
              <DeleteButton
                onClick={() => deleteReview.mutate({ id: item.id })}
              />
            </li>
          ))}
        </ul>
        <AddReviewDialog sortOrder={data.reviews.length} />
      </Card>

      <SectionHeader
        hint="The accordion near the bottom of the page."
        id="faq"
        title="FAQ"
      />
      <Card>
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
    </>
  );
}
