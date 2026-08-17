import { redirect } from "next/navigation";

/** Packages merged into Customers — old links and bookmarks land there. */
export default function PackagesPage() {
  redirect("/admin/customers");
}
