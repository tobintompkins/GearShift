import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, breakStart, breakEnd } = body; // action: 'start' or 'end'

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

    if (timeEntry.clockOut) {
      return NextResponse.json(
        { error: 'Cannot manage breaks for a clocked-out entry' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      if (timeEntry.breakStart && !timeEntry.breakEnd) {
        return NextResponse.json(
          { error: 'Break is already in progress' },
          { status: 400 }
        );
      }

      const updated = await prisma.timeEntry.update({
        where: { id: params.id },
        data: {
          breakStart: breakStart ? new Date(breakStart) : new Date(),
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

      return NextResponse.json(updated);
    } else if (action === 'end') {
      if (!timeEntry.breakStart) {
        return NextResponse.json(
          { error: 'No break in progress' },
          { status: 400 }
        );
      }

      if (timeEntry.breakEnd) {
        return NextResponse.json(
          { error: 'Break has already ended' },
          { status: 400 }
        );
      }

      const breakEndTime = breakEnd ? new Date(breakEnd) : new Date();
      const breakStartTime = new Date(timeEntry.breakStart);
      const breakMs = breakEndTime.getTime() - breakStartTime.getTime();
      const breakMinutes = Math.floor(breakMs / (1000 * 60));

      const updated = await prisma.timeEntry.update({
        where: { id: params.id },
        data: {
          breakEnd: breakEndTime,
          breakMinutes: timeEntry.breakMinutes + breakMinutes,
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

      return NextResponse.json(updated);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "end"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error managing break:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage break' },
      { status: 500 }
    );
  }
}

