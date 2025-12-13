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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { serviceDate, serviceMileage } = body;

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

    const serviceDateObj = serviceDate ? new Date(serviceDate) : new Date();
    const serviceMileageNum = serviceMileage
      ? Number(serviceMileage)
      : interval.vehicle?.mileage || null;

    // Calculate next due date and mileage
    const { nextDueDate, nextDueMileage } = calculateNextDue(
      serviceDateObj,
      serviceMileageNum,
      interval.intervalMileage,
      interval.intervalMonths,
      interval.vehicle?.mileage || null
    );

    const updated = await prisma.maintenanceInterval.update({
      where: { id: params.id },
      data: {
        lastServiceDate: serviceDateObj,
        lastServiceMileage: serviceMileageNum,
        nextDueDate,
        nextDueMileage,
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
    console.error('Error marking maintenance interval as complete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update maintenance interval' },
      { status: 500 }
    );
  }
}

