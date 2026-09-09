"use client";

import {
  FileText,
  LayoutDashboard,
  UserPlus,
  Wallet,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/onboard", label: "New signup", icon: UserPlus },
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

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
        collapsed && "justify-center px-0",
        active
          ? "bg-white/15 text-white"
          : "text-stone-300 hover:bg-white/10 hover:text-white",
      )}
      href={item.href}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="size-4 shrink-0" />
      {collapsed ? null : item.label}
    </Link>
  );
}

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return items.map((item) => (
    <NavLink
      collapsed={collapsed}
      item={item}
      key={item.href}
      pathname={pathname}
    />
  ));
}
