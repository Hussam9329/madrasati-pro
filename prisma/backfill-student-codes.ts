import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STUDENT_CODE_PREFIX = "MarinaSchoolStd-";

async function main() {
  const students = await prisma.student.findMany({
    where: { studentCode: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (students.length === 0) {
    console.log("No students without codes found.");
    return;
  }

  // Get existing codes to avoid duplicates
  const existingCodes = await prisma.student.findMany({
    where: {
      studentCode: { startsWith: STUDENT_CODE_PREFIX },
    },
    select: { studentCode: true },
  });
  const usedNumbers = new Set(
    existingCodes.map((s) =>
      Number(s.studentCode!.replace(STUDENT_CODE_PREFIX, "")),
    ).filter(Number.isFinite),
  );

  let nextNumber = 1;
  for (const student of students) {
    while (usedNumbers.has(nextNumber)) {
      nextNumber++;
    }
    const code = `${STUDENT_CODE_PREFIX}${String(nextNumber).padStart(4, "0")}`;
    await prisma.student.update({
      where: { id: student.id },
      data: { studentCode: code },
    });
    usedNumbers.add(nextNumber);
    nextNumber++;
    console.log(`Assigned ${code} to student ${student.id}`);
  }

  console.log(`Done! Assigned codes to ${students.length} students.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
