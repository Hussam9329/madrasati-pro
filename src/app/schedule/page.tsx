import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const revalidate = 30;

export default async function SchedulePage() {
  await requireAdmin();
  redirect("/schedules");
}
