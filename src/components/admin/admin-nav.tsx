"use client";

import {
  CalendarDays,
  Dumbbell,
  FileText,
  LayoutDashboard,
  Tags,
  TrendingUp,
  UserPlus,
  Wallet,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const dashboard = {
  href: "/admin",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true,
};

const groups = [
  {
    label: "Front desk",
    items: [
      { href: "/admin/onboard", label: "New signup", icon: UserPlus },
      { href: "/admin/invoices", label: "Invoices", icon: FileText },
      { href: "/admin/daily-income", label: "Daily Income", icon: Wallet },
      { href: "/admin/cms", label: "CMS", icon: WalletCards },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/admin/packages", label: "Packages", icon: Tags },
      { href: "/admin/coaches", label: "Coaches", icon: Dumbbell },
      { href: "/admin/reports", label: "Reports", icon: TrendingUp },
    ],
  },
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

  return (
    <>
      <NavLink collapsed={collapsed} item={dashboard} pathname={pathname} />
      {groups.map((group) => (
        <div className="grid gap-1" key={group.label}>
          {collapsed ? (
            <div className="mx-3 my-2 border-t border-white/10" />
          ) : (
            <p className="mt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink
              collapsed={collapsed}
              item={item}
              key={item.href}
              pathname={pathname}
            />
          ))}
        </div>
      ))}
    </>
  );
}
