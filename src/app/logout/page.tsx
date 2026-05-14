import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  cookieStore.delete("madrasati_session");
  redirect("/login");
}
