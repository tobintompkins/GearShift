import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addMonths } from 'date-fns';

// Helper function to calculate next due date and mileage
function calculateNextDue(
  lastServiceDate: Date | null,
  lastServiceMileage: number | null,
  intervalMileage: number | null,
  intervalMonths: number | null,
  currentMileage: number | null
): { nextDueDate: Date | null; nextDueMileage: number | null } {
  let nextDueDate: Date | null = null;
  let nextDueMileage: number | null = null;

  if (lastServiceDate && intervalMonths) {
    nextDueDate = addMonths(lastServiceDate, intervalMonths);
  }

  if (lastServiceMileage !== null && intervalMileage) {
    nextDueMileage = lastServiceMileage + intervalMileage;
  }

  return { nextDueDate, nextDueMileage };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interval = await prisma.maintenanceInterval.findUnique({
      where: { id: params.id },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            engine: true,
            mileage: true,
            licensePlate: true,
            vin: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!interval) {
      return NextResponse.json(
        { error: 'Maintenance interval not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interval);
  } catch (error: any) {
    console.error('Error fetching maintenance interval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch maintenance interval' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      intervalMileage,
      intervalMonths,
      lastServiceDate,
      lastServiceMileage,
      notes,
      isActive,
    } = body;

    const interval = await prisma.maintenanceInterval.findUnique({
      where: { id: params.id },
      include: {
        vehicle: {
          select: { mileage: true },
        },
      },
    });

    if (!interval) {
      return NextResponse.json(
        { error: 'Maintenance interval not found' },
        { status: 404 }
      );
    }

    const lastServiceDateObj = lastServiceDate !== undefined
      ? (lastServiceDate ? new Date(lastServiceDate) : null)
      : interval.lastServiceDate;
    const lastServiceMileageNum = lastServiceMileage !== undefined
      ? (lastServiceMileage ? Number(lastServiceMileage) : null)
      : interval.lastServiceMileage;

    const intervalMileageNum = intervalMileage !== undefined
      ? (intervalMileage ? Number(intervalMileage) : null)
      : interval.intervalMileage;
    const intervalMonthsNum = intervalMonths !== undefined
      ? (intervalMonths ? Number(intervalMonths) : null)
      : interval.intervalMonths;

    // Recalculate next due date and mileage
    const { nextDueDate, nextDueMileage } = calculateNextDue(
      lastServiceDateObj,
      lastServiceMileageNum,
      intervalMileageNum,
      intervalMonthsNum,
      interval.vehicle?.mileage || null
    );

    const updated = await prisma.maintenanceInterval.update({
      where: { id: params.id },
      data: {
        intervalMileage: intervalMileageNum,
        intervalMonths: intervalMonthsNum,
        lastServiceDate: lastServiceDateObj,
        lastServiceMileage: lastServiceMileageNum,
        nextDueDate,
        nextDueMileage,
        notes: notes !== undefined ? notes : interval.notes,
        isActive: isActive !== undefined ? isActive : interval.isActive,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            licensePlate: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating maintenance interval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update maintenance interval' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.maintenanceInterval.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting maintenance interval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete maintenance interval' },
      { status: 500 }
    );
  }
}

