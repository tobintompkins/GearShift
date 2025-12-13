import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const jobId = searchParams.get('jobId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (activeOnly) {
      where.clockOut = null; // Only entries that are still clocked in
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            customerFirstName: true,
            customerLastName: true,
            date: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { clockIn: 'desc' },
      ],
    });

    return NextResponse.json(timeEntries);
  } catch (error: any) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, jobId, date, clockIn, notes } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Check if employee is already clocked in (has an active entry)
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (activeEntry) {
      return NextResponse.json(
        { error: 'Employee is already clocked in. Please clock out first.' },
        { status: 400 }
      );
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId,
        jobId: jobId || null,
        date: date ? new Date(date) : new Date(),
        clockIn: clockIn ? new Date(clockIn) : new Date(),
        notes: notes || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error: any) {
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create time entry' },
      { status: 500 }
    );
  }
}

