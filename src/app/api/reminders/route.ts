import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ReminderFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const sent = searchParams.get('sent');

    const where: any = {};
    if (jobId) {
      where.jobId = jobId;
    }
    if (sent !== null) {
      where.sent = sent === 'true';
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        job: {
          include: {
            customer: true,
            employee: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ReminderFormData = await request.json();

    // Validate required fields
    if (!data.jobId || !data.type || !data.method || data.daysBefore === undefined) {
      return NextResponse.json(
        { error: 'Job ID, type, method, and daysBefore are required' },
        { status: 400 }
      );
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        jobId: data.jobId,
        type: data.type,
        method: data.method,
        daysBefore: data.daysBefore,
        message: data.message?.trim() || null,
      },
      include: {
        job: {
          include: {
            customer: true,
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reminder' },
      { status: 500 }
    );
  }
}


