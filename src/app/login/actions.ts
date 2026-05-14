"use server";

import { verifyAdmin, createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "يرجى إدخال اسم المستخدم وكلمة المرور." };
  }

  const admin = await verifyAdmin(username, password);
  if (!admin) {
    return { error: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  }

  await createSession(admin.id);
  redirect("/");
}
