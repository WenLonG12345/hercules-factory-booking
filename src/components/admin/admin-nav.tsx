"use client";

import {
  FileText,
  LayoutDashboard,
  LogOut,
  Wallet,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/components/admin/use-sign-out";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/daily-income", label: "Daily Income", icon: Wallet },
  { href: "/admin/cms", label: "CMS", icon: WalletCards },
];

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

/**
 * `rail` is the sidebar: icon-only on a portrait tablet (md), labels from lg,
 * and `collapsed` forces icon-only at lg too. The phone drawer passes neither
 * and always shows labels. Every item clears the 44px touch floor.
 */
type Mode = { rail?: boolean; collapsed?: boolean };

export const navItemClass = ({ rail, collapsed }: Mode, active = false) =>
  cn(
    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
    rail &&
      (collapsed
        ? "justify-center px-0"
        : "justify-center px-0 lg:justify-start lg:px-3"),
    active
      ? "bg-white/15 text-white"
      : "text-stone-300 hover:bg-white/10 hover:text-white",
  );

export const navLabelClass = ({ rail, collapsed }: Mode) =>
  rail ? (collapsed ? "hidden" : "hidden lg:inline") : undefined;

function NavLink({
  item,
  mode,
  pathname,
}: {
  item: NavItem;
  mode: Mode;
  pathname: string;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={navItemClass(mode, active)}
      href={item.href}
      title={mode.rail ? item.label : undefined}
    >
      <item.icon className="size-5 shrink-0" />
      <span className={navLabelClass(mode)}>{item.label}</span>
    </Link>
  );
}

export function AdminNav({ rail, collapsed }: Mode) {
  const pathname = usePathname();
  const signOut = useSignOut();
  const mode = { rail, collapsed };

  return (
    <>
      {items.map((item) => (
        <NavLink item={item} key={item.href} mode={mode} pathname={pathname} />
      ))}
      <button
        className={cn(navItemClass(mode), "mt-2")}
        onClick={signOut}
        title={rail ? "Sign out" : undefined}
        type="button"
      >
        <LogOut className="size-5 shrink-0" />
        <span className={navLabelClass(mode)}>Sign out</span>
      </button>
    </>
  );
}
