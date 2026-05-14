import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Seed Admin ─────────────────────────────
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("1993", 12);
    await prisma.admin.create({
      data: {
        username: "admin",
        passwordHash,
        isRoot: true,
      },
    });
    console.log("✅ Admin account created (username: admin)");
  } else {
    console.log("⏭️  Admin account already exists, skipping...");
  }

  // ── Seed School Classes ────────────────────
  const classNames = [
    { name: "الأول", level: "1" },
    { name: "الثاني", level: "2" },
    { name: "الثالث", level: "3" },
    { name: "الرابع", level: "4" },
    { name: "الخامس", level: "5" },
    { name: "السادس", level: "6" },
  ];

  for (const cls of classNames) {
    const existingClass = await prisma.schoolClass.findFirst({
      where: { name: cls.name, level: cls.level },
    });

    if (!existingClass) {
      const schoolClass = await prisma.schoolClass.create({
        data: {
          name: cls.name,
          level: cls.level,
          description: `الصف ${cls.name}`,
        },
      });

      // Create section "أ" for each class
      const existingSection = await prisma.section.findFirst({
        where: { classId: schoolClass.id, name: "أ" },
      });

      if (!existingSection) {
        await prisma.section.create({
          data: {
            name: "أ",
            classId: schoolClass.id,
            description: `شعبة أ - الصف ${cls.name}`,
          },
        });
      }

      console.log(`✅ Class "${cls.name}" with section "أ" created`);
    } else {
      console.log(`⏭️  Class "${cls.name}" already exists, skipping...`);
    }
  }

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
