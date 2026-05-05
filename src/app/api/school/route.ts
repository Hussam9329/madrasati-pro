import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const schools = await db.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
            classes: true,
          },
        },
      },
    });

    // Return first (or only) school as the main school info
    if (schools.length === 0) {
      return NextResponse.json({ school: null });
    }

    return NextResponse.json({ school: schools[0], schools });
  } catch (error) {
    console.error('Get school error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات المدرسة' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Find existing school or create if none exists
    const existingSchools = await db.school.findMany();

    let school;
    if (existingSchools.length > 0) {
      school = await db.school.update({
        where: { id: existingSchools[0].id },
        data: {
          name: body.name,
          logo: body.logo,
          address: body.address,
          phone: body.phone,
          email: body.email,
          principalName: body.principalName,
          academicYear: body.academicYear,
          schoolType: body.schoolType,
          shiftType: body.shiftType,
          startTime: body.startTime,
          endTime: body.endTime,
          lateThreshold: body.lateThreshold,
          weekendDays: body.weekendDays,
        },
      });
    } else {
      school = await db.school.create({
        data: {
          name: body.name || 'مدرستي',
          logo: body.logo,
          address: body.address,
          phone: body.phone,
          email: body.email,
          principalName: body.principalName,
          academicYear: body.academicYear || '2026-2027',
          schoolType: body.schoolType || 'ثانوية اعتيادية',
          shiftType: body.shiftType || 'صباحي',
          startTime: body.startTime || '08:00',
          endTime: body.endTime || '13:30',
          lateThreshold: body.lateThreshold || 10,
          weekendDays: body.weekendDays || '5,6',
        },
      });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Update school error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث بيانات المدرسة' },
      { status: 500 }
    );
  }
}
