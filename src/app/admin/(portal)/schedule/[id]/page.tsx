"use client";

import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { columnHelper, DataTable } from "@/components/ui/data-table";
import { Field, Select } from "@/components/ui/form";
import { api, type RouterOutputs } from "@/lib/trpc";
import {
  PACKAGE_TYPE_LABEL,
  packageStatus,
  remaining,
  SESSION_TYPE_LABEL,
} from "../../admin-format";

const STATUS_TONE = {
  booked: "gray",
  attended: "green",
  no_show: "red",
  cancelled: "gray",
  converted: "amber",
} as const;

type Attendee = NonNullable<
  RouterOutputs["schedule"]["byId"]
>["attendees"][number];

const helper = columnHelper<Attendee>();

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const utils = api.useUtils();
  const [customerId, setCustomerId] = useState("");

  const { data: session, isLoading } = api.schedule.byId.useQuery({ id });
  const { data: customers = [] } = api.customer.list.useQuery();

  const invalidate = () => {
    utils.schedule.byId.invalidate({ id });
    utils.schedule.week.invalidate();
    utils.report.dashboard.invalidate();
  };

  const addAttendee = api.schedule.addAttendee.useMutation({
    onSuccess: () => {
      toast.success("Added to roster.");
      setCustomerId("");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const setAttendance = api.schedule.setAttendance.useMutation({
    onSuccess: () => {
      toast.success("Updated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeAttendee = api.schedule.removeAttendee.useMutation({
    onSuccess: () => {
      toast.success("Removed.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const markAll = api.schedule.markAllAttended.useMutation({
    onSuccess: (result) => {
      if (result.failures.length) {
        toast.error(result.failures[0]);
      } else {
        toast.success(`${result.marked} marked attended.`);
      }
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading || !session) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-52 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
      </div>
    );
  }

  const roster = session.attendees;
  const onRoster = new Set(roster.map((attendee) => attendee.customerId));

  const columns = helper.columns([
    helper.display({
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <Link
          className="font-semibold text-red-700"
          href={`/admin/customers/${row.original.customerId}`}
        >
          {row.original.customer?.name}
        </Link>
      ),
    }),
    helper.display({
      id: "package",
      header: "Package",
      cell: ({ row }) => {
        const pkg = row.original.package;
        if (!pkg) return "Trial";
        const left = remaining(pkg);
        const expired = packageStatus(pkg) === "expired";
        return (
          <span className={expired ? "font-semibold text-red-700" : ""}>
            {PACKAGE_TYPE_LABEL[pkg.type]}
            {left === null ? "" : ` \u00b7 ${left} left`}
            {expired ? " \u00b7 EXPIRED" : ""}
          </span>
        );
      },
    }),
    helper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge tone={STATUS_TONE[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    }),
    helper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const attendee = row.original;
        return (
          <div className="flex flex-wrap gap-3">
            {attendee.status === "attended" ? (
              <button
                className="text-sm font-semibold text-stone-600"
                onClick={() =>
                  setAttendance.mutate({
                    attendeeId: attendee.id,
                    status: "booked",
                  })
                }
                type="button"
              >
                Undo attended
              </button>
            ) : (
              <button
                className="text-sm font-semibold text-emerald-700"
                onClick={() =>
                  setAttendance.mutate({
                    attendeeId: attendee.id,
                    status: "attended",
                  })
                }
                type="button"
              >
                Attended
              </button>
            )}
            <button
              className="text-sm font-semibold text-stone-500"
              onClick={() =>
                setAttendance.mutate({
                  attendeeId: attendee.id,
                  status: "no_show",
                })
              }
              type="button"
            >
              No show
            </button>
            <button
              className="text-sm font-semibold text-red-700"
              onClick={() => removeAttendee.mutate({ attendeeId: attendee.id })}
              type="button"
            >
              Remove
            </button>
          </div>
        );
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`${SESSION_TYPE_LABEL[session.type]} · ${session.date}`}
        title={session.title}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-11 items-center rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold"
            href="/admin/schedule"
          >
            Back to week
          </Link>
          <Button
            disabled={markAll.isPending}
            onClick={() => markAll.mutate({ id })}
            type="button"
          >
            Mark all attended
          </Button>
        </div>
      </PageHeader>

      <Card className="mb-6">
        <dl className="grid gap-4 sm:grid-cols-4">
          {[
            ["Time", `${session.startTime} – ${session.endTime}`],
            ["Coach", session.coach?.name ?? "—"],
            ["Capacity", `${roster.length}/${session.capacity}`],
            ["Status", session.isCancelled ? "Cancelled" : "Scheduled"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {label}
              </dt>
              <dd className="mt-1 font-semibold text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <Field className="min-w-64" label="Add to roster">
          <Select
            onChange={(e) => setCustomerId(e.target.value)}
            value={customerId}
          >
            <option value="">Select a customer…</option>
            {customers
              .filter((customer) => !onRoster.has(customer.id))
              .map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.phone}
                </option>
              ))}
          </Select>
        </Field>
        <Button
          disabled={!customerId || addAttendee.isPending}
          onClick={() => addAttendee.mutate({ sessionId: id, customerId })}
          type="button"
        >
          Add
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={roster}
        empty="Nobody on this roster yet."
        getRowId={(attendee) => attendee.id}
      />
    </>
  );
}
