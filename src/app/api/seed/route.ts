import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Check if already seeded
    const existingSchool = await db.school.findFirst();
    if (existingSchool) {
      return NextResponse.json({ message: 'Database already seeded', school: existingSchool });
    }

    // Create School
    const school = await db.school.create({
      data: {
        name: 'ثانوية الحسين للبنين',
        address: 'بغداد - الكرخ',
        phone: '07701234567',
        email: 'info@alhussein-school.iq',
        principalName: 'أ.د. محمد عبدالله',
        academicYear: '2026-2027',
        schoolType: 'ثانوية اعتيادية',
        shiftType: 'صباحي',
        startTime: '08:00',
        endTime: '13:30',
        lateThreshold: 10,
      },
    });

    // Create Classes
    const classData = [
      { name: 'الرابع الإعدادي - علمي', level: 'إعدادي', stage: 'الرابع', branch: 'علمي' },
      { name: 'الرابع الإعدادي - أدبي', level: 'إعدادي', stage: 'الرابع', branch: 'أدبي' },
      { name: 'الخامس الإعدادي - علمي', level: 'إعدادي', stage: 'الخامس', branch: 'علمي' },
      { name: 'الخامس الإعدادي - أدبي', level: 'إعدادي', stage: 'الخامس', branch: 'أدبي' },
      { name: 'السادس الإعدادي - أحيائي', level: 'إعدادي', stage: 'السادس', branch: 'أحيائي' },
      { name: 'السادس الإعدادي - تطبيقي', level: 'إعدادي', stage: 'السادس', branch: 'تطبيقي' },
    ];

    const classes = [];
    for (const cls of classData) {
      const created = await db.class.create({
        data: { ...cls, schoolId: school.id },
      });
      classes.push(created);

      // Create sections for each class
      await db.section.create({ data: { name: 'أ', classId: created.id, schoolId: school.id } });
      await db.section.create({ data: { name: 'ب', classId: created.id, schoolId: school.id } });
    }

    // Create Subjects
    const subjectData = [
      { name: 'التربية الإسلامية', code: 'ISL', maxScore: 100, passScore: 50 },
      { name: 'اللغة العربية', code: 'ARB', maxScore: 100, passScore: 50 },
      { name: 'اللغة الإنجليزية', code: 'ENG', maxScore: 100, passScore: 50 },
      { name: 'الأحياء', code: 'BIO', maxScore: 100, passScore: 50 },
      { name: 'الفيزياء', code: 'PHY', maxScore: 100, passScore: 50 },
      { name: 'الكيمياء', code: 'CHE', maxScore: 100, passScore: 50 },
      { name: 'الرياضيات', code: 'MAT', maxScore: 100, passScore: 50 },
    ];

    const subjects = [];
    for (const sub of subjectData) {
      const created = await db.subject.create({
        data: { ...sub, schoolId: school.id },
      });
      subjects.push(created);

      // Link subjects to all classes
      for (const cls of classes) {
        await db.subjectClass.create({
          data: { subjectId: created.id, classId: cls.id },
        });
      }

      // Create exam types for each subject
      const examTypes = [
        { name: 'شهر أول', maxScore: 20 },
        { name: 'شهر ثاني', maxScore: 20 },
        { name: 'النشاط والمشاركة', maxScore: 10 },
        { name: 'نصف السنة', maxScore: 50 },
        { name: 'نهاية السنة', maxScore: 100 },
      ];
      for (const et of examTypes) {
        await db.examType.create({
          data: { ...et, subjectId: created.id },
        });
      }
    }

    // Create Teachers
    const teacherData = [
      { fullName: 'أ. أحمد كاظم', phone: '07701111111', specialty: 'التربية الإسلامية' },
      { fullName: 'أ. مصطفى جواد', phone: '07702222222', specialty: 'التربية الإسلامية' },
      { fullName: 'أ. زينب محمد', phone: '07703333333', specialty: 'اللغة العربية' },
      { fullName: 'أ. حيدر علي', phone: '07704444444', specialty: 'اللغة العربية' },
      { fullName: 'أ. سارة حسين', phone: '07705555555', specialty: 'اللغة الإنجليزية' },
      { fullName: 'أ. علي عباس', phone: '07706666666', specialty: 'اللغة الإنجليزية' },
      { fullName: 'أ. مرتضى صالح', phone: '07707777777', specialty: 'الأحياء' },
      { fullName: 'أ. نور حسام', phone: '07708888888', specialty: 'الأحياء' },
      { fullName: 'أ. حسين خالد', phone: '07709999999', specialty: 'الفيزياء' },
      { fullName: 'أ. فاطمة ناصر', phone: '07701010101', specialty: 'الفيزياء' },
      { fullName: 'أ. عباس جعفر', phone: '07702020202', specialty: 'الكيمياء' },
      { fullName: 'أ. مريم رضا', phone: '07703030303', specialty: 'الكيمياء' },
      { fullName: 'أ. كريم حمزة', phone: '07704040404', specialty: 'الرياضيات' },
      { fullName: 'أ. محمد طالب', phone: '07705050505', specialty: 'الرياضيات' },
    ];

    const teachers = [];
    for (const t of teacherData) {
      const created = await db.teacher.create({
        data: { ...t, schoolId: school.id },
      });
      teachers.push(created);
    }

    // Link teachers to subjects (2 teachers per subject)
    for (let i = 0; i < subjects.length; i++) {
      await db.teacherSubject.create({
        data: { teacherId: teachers[i * 2].id, subjectId: subjects[i].id },
      });
      await db.teacherSubject.create({
        data: { teacherId: teachers[i * 2 + 1].id, subjectId: subjects[i].id },
      });
    }

    // Create sample students
    const studentNames = [
      'علي حسين جاسم', 'أحمد محمد صالح', 'حسين عبدالله كاظم',
      'محمد رضا جعفر', 'عباس طالب حسن', 'كريم صباح نوري',
      'مصطفى حيدر عبد', 'جعفر علي حسين', 'سجاد أحمد محمد',
      'يوسف كاظم رضا', 'زينب محمد علي', 'فاطمة حسين أحمد',
      'مريم عباس جواد', 'نور سعيد خالد', 'سارة طالب عبد',
      'حلا كريم حسن', 'رنا مصطفى صالح', 'دانا محمد جاسم',
      'لينا أحمد ناصر', 'آية حسين علي', 'عمر خالد إبراهيم',
      'ياسر محمد حسن', 'بلال علي جعفر', 'عمار حسين صالح',
      'ثائر أحمد كاظم', 'وليد عبدالله نوري', 'رعد طالب محمد',
      'قاسم حسين عباس', 'نبيل سعيد جواد', 'صباح محمد رضا',
    ];

    const allSections = await db.section.findMany();
    let studentCounter = 1;

    for (let i = 0; i < studentNames.length; i++) {
      const sectionIndex = i % allSections.length;
      const section = allSections[sectionIndex];
      const cls = classes.find(c => c.id === section.classId);
      
      const gender = i < 20 ? 'ذكر' : 'أنثى';
      const studentNumber = `STU-2026-${String(studentCounter).padStart(5, '0')}`;
      const qrCode = `MADRASATI-${studentNumber}-${Date.now()}`;

      await db.student.create({
        data: {
          studentNumber,
          fullName: studentNames[i],
          gender,
          dateOfBirth: `2008-0${(i % 9) + 1}-${(i % 28) + 1}`,
          nationalId: `1000${String(i + 1).padStart(8, '0')}`,
          phone: `0770${String(6000000 + i)}`,
          status: 'مستمر',
          qrCode,
          cardStatus: 'فعالة',
          classId: cls!.id,
          sectionId: section.id,
          schoolId: school.id,
          guardianName: `ولي أمر ${studentNames[i].split(' ')[0]}`,
          guardianPhone: `0771${String(7000000 + i)}`,
          guardianRelation: 'أب',
        },
      });
      studentCounter++;
    }

    // Create Users
    const users = [
      { username: 'admin', name: 'المدير العام', role: 'مدير', password: hashPassword('admin123') },
      { username: 'assistant', name: 'المعاون الإداري', role: 'معاون', password: hashPassword('assistant123') },
      { username: 'registrar', name: 'موظف التسجيل', role: 'موظف تسجيل', password: hashPassword('registrar123') },
      { username: 'gate', name: 'موظف البوابة', role: 'موظف بوابة', password: hashPassword('gate123') },
    ];

    for (const u of users) {
      await db.user.create({ data: u });
    }

    // Create some notices
    await db.notice.createMany({
      data: [
        { title: 'بداية العام الدراسي', content: 'يسعدنا أن نرحب بجميع الطلاب في العام الدراسي 2026-2027', type: 'عام', schoolId: school.id, createdBy: 'المدير العام' },
        { title: 'جدول الامتحانات', content: 'سيتم الإعلان عن جدول امتحانات الشهر الأول قريباً', type: 'أكاديمي', schoolId: school.id, createdBy: 'المدير العام' },
        { title: 'صيانة المبنى', content: 'سيتم صيانة الطابق الثاني يوم الخميس القادم', type: 'عام', schoolId: school.id, createdBy: 'المدير العام' },
      ],
    });

    return NextResponse.json({ 
      message: 'Database seeded successfully!',
      school: school.name,
      classes: classes.length,
      sections: allSections.length,
      subjects: subjects.length,
      teachers: teachers.length,
      students: studentNames.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 });
  }
}
