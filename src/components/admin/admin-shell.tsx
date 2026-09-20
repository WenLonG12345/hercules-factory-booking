"use client";

/* Hallmark · genre: modern-minimal · scope: app shell · designed-as-app
 * tablet-first: md = portrait tablet (icon rail), lg = landscape (full
 * sidebar), <md = phone (Sheet drawer). Touch floor 44px. */

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Toaster } from "sonner";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col border-r border-stone-200 bg-stone-950 text-stone-100 transition-[width] md:flex",
          collapsed ? "w-16" : "w-16 lg:w-64",
        )}
      >
        <Link
          className={cn(
            "flex items-center gap-3 border-b border-white/10 p-3",
            collapsed
              ? "justify-center"
              : "justify-center lg:justify-start lg:p-6",
          )}
          href="/admin"
        >
          <Image
            alt="Hercules Factory logo"
            className="size-10 rounded-md"
            height={44}
            src="/logo.png"
            width={44}
          />
          <div className={collapsed ? "hidden" : "hidden lg:block"}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Hercules
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Management
            </h1>
          </div>
        </Link>
        <nav className="grid gap-1 p-3">
          <AdminNav collapsed={collapsed} rail />
        </nav>
        <button
          className={cn(
            "mx-3 mb-3 mt-auto hidden min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-stone-400 transition hover:bg-white/10 hover:text-white lg:flex",
            collapsed && "justify-center px-0",
          )}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" />
              Collapse
            </>
          )}
        </button>
      </aside>

      <div className={cn(collapsed ? "md:pl-16" : "md:pl-16 lg:pl-64")}>
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 py-2 backdrop-blur md:hidden">
          <Link
            className="flex min-h-11 items-center gap-2 font-black tracking-tight"
            href="/admin"
          >
            <Image
              alt="Hercules Factory logo"
              className="size-9 rounded-md"
              height={36}
              src="/logo.png"
              width={36}
            />
            Hercules HQ
          </Link>
          <Sheet onOpenChange={setDrawerOpen} open={drawerOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="grid size-11 place-items-center rounded-md bg-stone-950 text-white"
                type="button"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              className="border-white/10 bg-stone-950 text-stone-100"
              side="right"
            >
              <SheetTitle className="p-4 pr-14 text-amber-300">
                Hercules Management
              </SheetTitle>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: bubbling close, the links themselves are keyboard-reachable */}
              <nav
                className="grid gap-1 px-3"
                onClick={() => setDrawerOpen(false)}
              >
                <AdminNav />
              </nav>
            </SheetContent>
          </Sheet>
        </header>
        <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-950">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
