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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const intervalType = searchParams.get('intervalType');
    const overdue = searchParams.get('overdue') === 'true';
    const dueSoon = searchParams.get('dueSoon') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (intervalType) {
      where.intervalType = intervalType;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    if (overdue) {
      const today = new Date();
      where.OR = [
        { nextDueDate: { lt: today } },
        { nextDueMileage: { not: null } }, // Will filter in code for mileage-based
      ];
    }

    if (dueSoon) {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      where.nextDueDate = {
        gte: today,
        lte: nextWeek,
      };
    }

    const intervals = await prisma.maintenanceInterval.findMany({
      where,
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
      orderBy: [
        { nextDueDate: 'asc' },
        { nextDueMileage: 'asc' },
      ],
    });

    // Filter for overdue by mileage if needed
    let filteredIntervals = intervals;
    if (overdue) {
      filteredIntervals = intervals.filter((interval) => {
        if (interval.nextDueDate && interval.nextDueDate < new Date()) {
          return true;
        }
        if (interval.nextDueMileage && interval.vehicle?.mileage) {
          return interval.vehicle.mileage >= interval.nextDueMileage;
        }
        return false;
      });
    }

    return NextResponse.json(filteredIntervals);
  } catch (error: any) {
    console.error('Error fetching maintenance intervals:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch maintenance intervals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      intervalType,
      intervalMileage,
      intervalMonths,
      lastServiceDate,
      lastServiceMileage,
      notes,
      isActive,
    } = body;

    if (!vehicleId || !intervalType) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, intervalType' },
        { status: 400 }
      );
    }

    // Get vehicle to get current mileage
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { mileage: true },
    });

    const lastServiceDateObj = lastServiceDate ? new Date(lastServiceDate) : null;
    const lastServiceMileageNum = lastServiceMileage ? Number(lastServiceMileage) : null;

    // Calculate next due date and mileage
    const { nextDueDate, nextDueMileage } = calculateNextDue(
      lastServiceDateObj,
      lastServiceMileageNum,
      intervalMileage ? Number(intervalMileage) : null,
      intervalMonths ? Number(intervalMonths) : null,
      vehicle?.mileage || null
    );

    const interval = await prisma.maintenanceInterval.create({
      data: {
        vehicleId,
        intervalType,
        intervalMileage: intervalMileage ? Number(intervalMileage) : null,
        intervalMonths: intervalMonths ? Number(intervalMonths) : null,
        lastServiceDate: lastServiceDateObj,
        lastServiceMileage: lastServiceMileageNum,
        nextDueDate,
        nextDueMileage,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
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

    return NextResponse.json(interval, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance interval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create maintenance interval' },
      { status: 500 }
    );
  }
}

