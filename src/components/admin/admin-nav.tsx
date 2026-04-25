"use client";

import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Tags,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/memberships", label: "Memberships", icon: Tags },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: MessageSquareText },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: CreditCard },
  { href: "/admin/cms", label: "CMS", icon: WalletCards },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/15 text-white"
                : "text-stone-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
