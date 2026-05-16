import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { safeQuery } from "@/lib/db";
import { getStudents } from "@/services/student-service";
import { getActiveTeachers } from "@/services/teacher-service";
import { getClasses } from "@/services/class-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "غير مصرح." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, data: [] });
  }

  const [students, teachers, classes] = await Promise.all([
    safeQuery(() => getStudents({ query: q, status: "active" }), []),
    safeQuery(() => getActiveTeachers(), []),
    safeQuery(() => getClasses(), []),
  ]);

  const lowered = q.toLowerCase();
  const data = [
    ...students.slice(0, 5).map((student: any) => ({
      type: "طالب",
      title: student.fullName,
      subtitle: student.className ? `${student.className}${student.sectionName ? ` / ${student.sectionName}` : ""}` : "بدون صف",
      href: `/students/${student.id}`,
    })),
    ...teachers
      .filter((teacher: any) => teacher.fullName?.toLowerCase().includes(lowered) || teacher.specialty?.toLowerCase().includes(lowered))
      .slice(0, 4)
      .map((teacher: any) => ({ type: "مدرس", title: teacher.fullName, subtitle: teacher.specialty ?? "", href: "/teachers" })),
    ...classes
      .filter((schoolClass: any) => schoolClass.name?.toLowerCase().includes(lowered) || schoolClass.level?.toLowerCase().includes(lowered))
      .slice(0, 4)
      .map((schoolClass: any) => ({ type: "صف", title: schoolClass.name, subtitle: schoolClass.level ?? "", href: "/classes" })),
  ].slice(0, 10);

  return NextResponse.json({ ok: true, data });
}
