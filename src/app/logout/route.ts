import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET() {
  await logout();
  redirect("/login");
}

export async function POST() {
  await logout();
  redirect("/login");
}
