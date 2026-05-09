import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🗑️ بدء تفريغ قاعدة البيانات...\n')

  // ترتيب الحذف يحترم القيود الخارجية (الأبناء أولاً ثم الآباء)
  
  // 1. الدفعات
  const payments = await prisma.payment.deleteMany()
  console.log(`✅ تم حذف ${payments.count} دفعة`)

  // 2. الأقساط
  const installments = await prisma.installment.deleteMany()
  console.log(`✅ تم حذف ${installments.count} قسط`)

  // 3. خطط الرسوم
  const feePlans = await prisma.feePlan.deleteMany()
  console.log(`✅ تم حذف ${feePlans.count} خطة رسوم`)

  // 4. الدرجات
  const grades = await prisma.grade.deleteMany()
  console.log(`✅ تم حذف ${grades.count} درجة`)

  // 5. سجلات الحضور
  const attendance = await prisma.attendanceRecord.deleteMany()
  console.log(`✅ تم حذف ${attendance.count} سجل حضور`)

  // 6. أنواع الامتحانات
  const examTypes = await prisma.examType.deleteMany()
  console.log(`✅ تم حذف ${examTypes.count} نوع امتحان`)

  // 7. الجدول المدرسي
  const scheduleSlots = await prisma.scheduleSlot.deleteMany()
  console.log(`✅ تم حذف ${scheduleSlots.count} فترة جدول`)

  // 8. روابط المعلمين بالمواد
  const teacherSubjects = await prisma.teacherSubject.deleteMany()
  console.log(`✅ تم حذف ${teacherSubjects.count} رابط معلم-مادة`)

  // 9. روابط المواد بالصفوف
  const subjectClasses = await prisma.subjectClass.deleteMany()
  console.log(`✅ تم حذف ${subjectClasses.count} رابط مادة-صف`)

  // 10. روابط المعلمين بالصفوف
  const teacherClasses = await prisma.teacherClass.deleteMany()
  console.log(`✅ تم حذف ${teacherClasses.count} رابط معلم-صف`)

  // 11. الطلبة
  const students = await prisma.student.deleteMany()
  console.log(`✅ تم حذف ${students.count} طالب`)

  // 12. الشعب
  const sections = await prisma.section.deleteMany()
  console.log(`✅ تم حذف ${sections.count} شعبة`)

  // 13. المعلمون
  const teachers = await prisma.teacher.deleteMany()
  console.log(`✅ تم حذف ${teachers.count} معلم`)

  // 14. المواد
  const subjects = await prisma.subject.deleteMany()
  console.log(`✅ تم حذف ${subjects.count} مادة`)

  // 15. الصفوف
  const classes = await prisma.class.deleteMany()
  console.log(`✅ تم حذف ${classes.count} صف`)

  // 16. المدرسة
  const schools = await prisma.school.deleteMany()
  console.log(`✅ تم حذف ${schools.count} مدرسة`)

  // 17. المستخدمون
  const users = await prisma.user.deleteMany()
  console.log(`✅ تم حذف ${users.count} مستخدم`)

  console.log('\n🎉 تم تفريغ قاعدة البيانات بالكامل!')
}

clearDatabase()
  .catch((e) => {
    console.error('❌ خطأ في تفريغ قاعدة البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
