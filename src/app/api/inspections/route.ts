import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const jobId = searchParams.get('jobId');
    const employeeId = searchParams.get('employeeId');
    const overallStatus = searchParams.get('overallStatus');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const completeOnly = searchParams.get('completeOnly') === 'true';

    const where: any = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (overallStatus) {
      where.overallStatus = overallStatus;
    }

    if (startDate && endDate) {
      where.inspectionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (completeOnly) {
      where.isComplete = true;
    }

    const inspections = await prisma.inspectionChecklist.findMany({
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
        job: {
          select: {
            id: true,
            serviceType: true,
            status: true,
            date: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { inspectionDate: 'desc' },
    });

    return NextResponse.json(inspections);
  } catch (error: any) {
    console.error('Error fetching inspection checklists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inspection checklists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      jobId,
      employeeId,
      inspectionDate,
      mileage,
      tiresStatus,
      tiresNotes,
      brakesStatus,
      brakesNotes,
      suspensionStatus,
      suspensionNotes,
      steeringStatus,
      steeringNotes,
      fluidsStatus,
      fluidsNotes,
      beltsHosesStatus,
      beltsHosesNotes,
      batteryStatus,
      batteryNotes,
      overallStatus,
      overallNotes,
      recommendations,
      customerSignature,
      inspectorSignature,
      isComplete,
    } = body;

    if (!vehicleId || !inspectionDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, inspectionDate' },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspectionChecklist.create({
      data: {
        vehicleId,
        jobId: jobId || null,
        employeeId: employeeId || null,
        inspectionDate: new Date(inspectionDate),
        mileage: mileage ? Number(mileage) : null,
        tiresStatus: tiresStatus || null,
        tiresNotes: tiresNotes || null,
        brakesStatus: brakesStatus || null,
        brakesNotes: brakesNotes || null,
        suspensionStatus: suspensionStatus || null,
        suspensionNotes: suspensionNotes || null,
        steeringStatus: steeringStatus || null,
        steeringNotes: steeringNotes || null,
        fluidsStatus: fluidsStatus || null,
        fluidsNotes: fluidsNotes || null,
        beltsHosesStatus: beltsHosesStatus || null,
        beltsHosesNotes: beltsHosesNotes || null,
        batteryStatus: batteryStatus || null,
        batteryNotes: batteryNotes || null,
        overallStatus: overallStatus || null,
        overallNotes: overallNotes || null,
        recommendations: recommendations || null,
        customerSignature: customerSignature || null,
        inspectorSignature: inspectorSignature || null,
        isComplete: isComplete !== undefined ? isComplete : false,
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
        job: {
          select: {
            id: true,
            serviceType: true,
            status: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inspection checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create inspection checklist' },
      { status: 500 }
    );
  }
}

