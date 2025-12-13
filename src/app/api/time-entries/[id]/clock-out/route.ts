import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { clockOut, notes } = body;

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
        { error: 'Employee is already clocked out' },
        { status: 400 }
      );
    }

    const clockOutTime = clockOut ? new Date(clockOut) : new Date();

    // Calculate total minutes worked
    const clockInTime = new Date(timeEntry.clockIn);
    const totalMs = clockOutTime.getTime() - clockInTime.getTime();
    const totalMinutes = Math.floor(totalMs / (1000 * 60)) - timeEntry.breakMinutes;

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        clockOut: clockOutTime,
        totalMinutes: totalMinutes > 0 ? totalMinutes : 0,
        notes: notes || timeEntry.notes,
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
  } catch (error: any) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clock out' },
      { status: 500 }
    );
  }
}

