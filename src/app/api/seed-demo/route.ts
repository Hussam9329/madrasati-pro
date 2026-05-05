import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const school = await db.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: 'School not found. Run /api/seed first.' }, { status: 400 });
    }

    const students = await db.student.findMany();
    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found' }, { status: 400 });
    }

    const today = new Date();
    const attendanceCount = await db.attendanceRecord.count();
    const gradesCount = await db.grade.count();

    // Only seed demo data if not already present
    if (attendanceCount > 0 && gradesCount > 0) {
      return NextResponse.json({ 
        message: 'Demo data already exists', 
        attendance: attendanceCount, 
        grades: gradesCount 
      });
    }

    // === Generate attendance records for the last 7 days ===
    const statuses = ['حاضر', 'حاضر', 'حاضر', 'حاضر', 'حاضر', 'حاضر', 'حاضر', 'متأخر', 'متأخر', 'غائب', 'مستأذن'];
    
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Skip weekends (Friday=5, Saturday=6)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;

      for (const student of students) {
        // Random attendance status with 70% present, 15% late, 10% absent, 5% excused
        const rand = Math.random();
        let status: string;
        let checkIn: string | null = null;
        let lateMinutes: number | null = null;

        if (rand < 0.70) {
          status = 'حاضر';
          const hour = 7;
          const minute = Math.floor(Math.random() * 55);
          checkIn = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        } else if (rand < 0.85) {
          status = 'متأخر';
          const minute = Math.floor(Math.random() * 20) + 10;
          checkIn = `08:${String(minute).padStart(2, '0')}`;
          lateMinutes = minute;
        } else if (rand < 0.95) {
          status = 'غائب';
        } else {
          status = 'مستأذن';
          checkIn = `08:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
        }

        // Check if record already exists for this student+date
        const existing = await db.attendanceRecord.findFirst({
          where: { studentId: student.id, date: dateStr },
        });

        if (!existing) {
          await db.attendanceRecord.create({
            data: {
              studentId: student.id,
              schoolId: school.id,
              date: dateStr,
              checkIn,
              status,
              lateMinutes,
            },
          });
        }
      }
    }

    // === Generate sample grades ===
    const subjects = await db.subject.findMany({
      include: { examTypes: true },
    });

    for (const subject of subjects) {
      for (const examType of subject.examTypes) {
        // Only generate grades for first exam type of each subject to keep it manageable
        if (examType.name !== 'شهر أول') continue;

        for (const student of students) {
          // Check if grade already exists
          const existingGrade = await db.grade.findFirst({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              examTypeId: examType.id,
            },
          });

          if (!existingGrade) {
            // Random score between 5 and maxScore
            const maxScore = examType.maxScore;
            const score = Math.floor(Math.random() * (maxScore - 5)) + 5;
            const status = score >= subject.passScore ? 'مكتملة' : 'ناقصة';

            await db.grade.create({
              data: {
                studentId: student.id,
                subjectId: subject.id,
                examTypeId: examType.id,
                schoolId: school.id,
                score,
                status,
                approved: Math.random() > 0.7,
              },
            });
          }
        }
      }
    }

    // Add more exam grades for some students
    for (const subject of subjects) {
      const examTypes = subject.examTypes;
      if (examTypes.length < 2) continue;

      // Add "شهر ثاني" grades for some students
      const examType2 = examTypes.find(et => et.name === 'شهر ثاني');
      if (!examType2) continue;

      for (let i = 0; i < Math.min(students.length, 15); i++) {
        const student = students[i];
        const existingGrade = await db.grade.findFirst({
          where: {
            studentId: student.id,
            subjectId: subject.id,
            examTypeId: examType2.id,
          },
        });

        if (!existingGrade) {
          const maxScore = examType2.maxScore;
          const score = Math.floor(Math.random() * (maxScore - 3)) + 3;

          await db.grade.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              examTypeId: examType2.id,
              schoolId: school.id,
              score,
              status: 'مكتملة',
              approved: false,
            },
          });
        }
      }
    }

    // Create more notices
    const additionalNotices = [
      { title: 'تنبيه: غياب متكرر', content: 'تم رصد غياب متكرر لبعض الطلاب، يرجى التواصل مع أولياء الأمور', type: 'عاجل', schoolId: school.id, createdBy: 'المعاون الإداري' },
      { title: 'نتائج شهر أول', content: 'تم الانتهاء من تصحيح امتحانات الشهر الأول وسيتم الإعلان عن النتائج قريباً', type: 'أكاديمي', schoolId: school.id, createdBy: 'المدير العام' },
      { title: 'اجتماع المدرسين', content: 'يوم الأحد القادم الساعة 10 صباحاً اجتماع المدرسين لمناقشة سير العملية التعليمية', type: 'عام', schoolId: school.id, createdBy: 'المدير العام' },
    ];

    for (const notice of additionalNotices) {
      await db.notice.create({ data: notice });
    }

    const finalAttendance = await db.attendanceRecord.count();
    const finalGrades = await db.grade.count();

    return NextResponse.json({
      message: 'Demo data seeded successfully!',
      attendanceRecords: finalAttendance,
      gradeRecords: finalGrades,
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json({ error: 'Failed to seed demo data', details: String(error) }, { status: 500 });
  }
}
