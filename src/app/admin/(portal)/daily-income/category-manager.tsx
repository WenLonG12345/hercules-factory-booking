"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { LedgerCategory, LedgerDirection } from "@/db/schema";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export function CategoryManagerDialog({
  categories,
  onSuccess,
}: {
  categories: LedgerCategory[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="quiet">
          Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {(["income", "expense"] as const).map((direction) => (
            <CategoryList
              key={direction}
              direction={direction}
              categories={categories.filter(
                (category) => category.direction === direction,
              )}
              onSuccess={onSuccess}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryList({
  direction,
  categories,
  onSuccess,
}: {
  direction: LedgerDirection;
  categories: LedgerCategory[];
  onSuccess?: () => void;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState("");

  const refresh = () => {
    utils.ledger.categories.list.invalidate();
    onSuccess?.();
  };

  const create = api.ledger.categories.create.useMutation({
    onSuccess: () => {
      setName("");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const update = api.ledger.categories.update.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const remove = api.ledger.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted.");
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">
        {direction === "income" ? "Income" : "Expense"}
      </h3>

      <ul className="grid gap-1">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2 py-1.5"
          >
            <Input
              className={cn(
                "h-9 flex-1 border-transparent",
                category.isArchived && "text-stone-400",
              )}
              defaultValue={category.name}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== category.name) {
                  update.mutate({ id: category.id, name: next });
                }
              }}
            />
            {category.slug ? <Badge tone="gray">System</Badge> : null}
            <div className="flex shrink-0 items-center gap-2 pl-1 pr-2 text-xs font-semibold text-stone-500">
              <Switch
                checked={!category.isArchived}
                id={`active-${category.id}`}
                onCheckedChange={(checked) =>
                  update.mutate({ id: category.id, isArchived: !checked })
                }
              />
              <label className="w-12" htmlFor={`active-${category.id}`}>
                {category.isArchived ? "Archived" : "Active"}
              </label>
            </div>
            {category.slug ? null : (
              <button
                className="rounded p-1.5 text-red-700 hover:bg-red-50"
                onClick={() => remove.mutate({ id: category.id })}
                title="Delete"
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          create.mutate({ name: name.trim(), direction });
        }}
      >
        <Input
          className="flex-1"
          onChange={(e) => setName(e.target.value)}
          placeholder={
            direction === "income" ? "e.g. Mineral Water" : "e.g. Air Selangor"
          }
          value={name}
        />
        <Button disabled={create.isPending} type="submit" variant="quiet">
          Add
        </Button>
      </form>
    </section>
  );
}
