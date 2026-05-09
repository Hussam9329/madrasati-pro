import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 بدء إعداد البيانات الأساسية...\n')

  // 1. إنشاء المدرسة ببيانات ثابتة
  const existingSchools = await prisma.school.findMany()
  
  if (existingSchools.length === 0) {
    const school = await prisma.school.create({
      data: {
        name: 'ثانوية مارينا',
        address: 'زيونة - الشارع الخدمي لدار الازياء',
        academicYear: '2026-2027',
        schoolType: 'ثانوية اعتيادية',
        shiftType: 'صباحي',
        startTime: '08:00',
        endTime: '13:30',
        lateThreshold: 10,
        weekendDays: '5,6',
      },
    })
    console.log(`✅ تم إنشاء المدرسة: ${school.name}`)
    console.log(`   العنوان: ${school.address}`)
  } else {
    // تأكد من أن الاسم والعنوان ثابتان
    await prisma.school.update({
      where: { id: existingSchools[0].id },
      data: {
        name: 'ثانوية مارينا',
        address: 'زيونة - الشارع الخدمي لدار الازياء',
      },
    })
    console.log('✅ تم تحديث بيانات المدرسة الثابتة')
  }

  // 2. إنشاء مستخدم المدير الافتراضي
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } })
  
  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashSync('admin', 10),
        name: 'مدير النظام',
        role: 'مدير',
        active: true,
      },
    })
    console.log(`✅ تم إنشاء مستخدم المدير: ${admin.username}`)
  } else {
    console.log('ℹ️ مستخدم المدير موجود بالفعل')
  }

  console.log('\n🎉 تم إعداد البيانات الأساسية بنجاح!')
}

seed()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
