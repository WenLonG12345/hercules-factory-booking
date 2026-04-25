import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("60")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `6${digits}`;
  }

  return `60${digits}`;
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${formatWhatsAppPhone(phone)}?text=${encodeURIComponent(
    message,
  )}`;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
