import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { addMonths, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const reminderType = searchParams.get('reminderType');
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue') === 'true';
    const upcoming = searchParams.get('upcoming') === 'true';

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (reminderType) {
      where.reminderType = reminderType;
    }

    if (status) {
      where.status = status;
    } else {
      // Default: exclude cancelled
      where.status = { not: 'cancelled' };
    }

    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['pending', 'sent'] };
    }

    if (upcoming) {
      const today = new Date();
      const nextWeek = addDays(today, 7);
      where.dueDate = { gte: today, lte: nextWeek };
      where.status = { in: ['pending', 'sent'] };
    }

    const reminders = await prisma.maintenanceReminder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            licensePlate: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { status: 'asc' },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error: any) {
    console.error('Error fetching maintenance reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch maintenance reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      vehicleId,
      reminderType,
      title,
      description,
      dueDate,
      dueMileage,
      currentMileage,
      notes,
    } = body;

    if (!customerId || !vehicleId || !reminderType || !title || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, vehicleId, reminderType, title, dueDate' },
        { status: 400 }
      );
    }

    const reminder = await prisma.maintenanceReminder.create({
      data: {
        customerId,
        vehicleId,
        reminderType,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        dueMileage: dueMileage || null,
        currentMileage: currentMileage || null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            licensePlate: true,
          },
        },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create maintenance reminder' },
      { status: 500 }
    );
  }
}

// Auto-generate reminders from maintenance history
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate-from-maintenance') {
      // Find all maintenance records that should generate reminders
      const maintenanceRecords = await prisma.vehicleMaintenanceHistory.findMany({
        where: {
          serviceType: {
            in: ['Oil Change', 'Brake Service', 'Brake Inspection', 'Inspection'],
          },
        },
        include: {
          vehicle: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { serviceDate: 'desc' },
      });

      const generatedReminders = [];

      for (const record of maintenanceRecords) {
        let reminderType: string | null = null;
        let title = '';
        let dueDate: Date | null = null;
        let dueMileage: number | null = null;

        // Determine reminder type and calculate due date
        if (record.serviceType.toLowerCase().includes('oil')) {
          reminderType = 'oil-change';
          title = 'Oil Change Due';
          // Oil change typically every 3-6 months or 3,000-5,000 miles
          dueDate = addMonths(new Date(record.serviceDate), 3);
          dueMileage = record.mileage + 3000;
        } else if (record.serviceType.toLowerCase().includes('brake')) {
          reminderType = 'brake-check';
          title = 'Brake Check Follow-up';
          // Brake check typically every 6-12 months or 10,000-15,000 miles
          dueDate = addMonths(new Date(record.serviceDate), 6);
          dueMileage = record.mileage + 10000;
        } else if (record.serviceType.toLowerCase().includes('inspection')) {
          reminderType = 'inspection-6month';
          title = '6-Month Inspection Due';
          // 6-month inspection
          dueDate = addMonths(new Date(record.serviceDate), 6);
        }

        if (reminderType && dueDate) {
          // Check if reminder already exists
          const existing = await prisma.maintenanceReminder.findFirst({
            where: {
              vehicleId: record.vehicleId,
              reminderType,
              status: { in: ['pending', 'sent'] },
            },
          });

          if (!existing) {
            const reminder = await prisma.maintenanceReminder.create({
              data: {
                customerId: record.vehicle.customerId,
                vehicleId: record.vehicleId,
                reminderType,
                title,
                description: `Based on ${record.serviceType} performed on ${new Date(record.serviceDate).toLocaleDateString()}`,
                dueDate,
                dueMileage,
                currentMileage: record.vehicle.mileage,
                relatedMaintenanceId: record.id,
                status: 'pending',
              },
            });
            generatedReminders.push(reminder);
          }
        }
      }

      return NextResponse.json({
        success: true,
        count: generatedReminders.length,
        reminders: generatedReminders,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating reminders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reminders' },
      { status: 500 }
    );
  }
}

