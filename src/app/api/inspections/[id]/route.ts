import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inspection = await prisma.inspectionChecklist.findUnique({
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
            color: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                address: true,
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
            price: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection checklist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inspection);
  } catch (error: any) {
    console.error('Error fetching inspection checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inspection checklist' },
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

    const inspection = await prisma.inspectionChecklist.findUnique({
      where: { id: params.id },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection checklist not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.inspectionChecklist.update({
      where: { id: params.id },
      data: {
        jobId: jobId !== undefined ? jobId : inspection.jobId,
        employeeId: employeeId !== undefined ? employeeId : inspection.employeeId,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : inspection.inspectionDate,
        mileage: mileage !== undefined ? (mileage ? Number(mileage) : null) : inspection.mileage,
        tiresStatus: tiresStatus !== undefined ? tiresStatus : inspection.tiresStatus,
        tiresNotes: tiresNotes !== undefined ? tiresNotes : inspection.tiresNotes,
        brakesStatus: brakesStatus !== undefined ? brakesStatus : inspection.brakesStatus,
        brakesNotes: brakesNotes !== undefined ? brakesNotes : inspection.brakesNotes,
        suspensionStatus: suspensionStatus !== undefined ? suspensionStatus : inspection.suspensionStatus,
        suspensionNotes: suspensionNotes !== undefined ? suspensionNotes : inspection.suspensionNotes,
        steeringStatus: steeringStatus !== undefined ? steeringStatus : inspection.steeringStatus,
        steeringNotes: steeringNotes !== undefined ? steeringNotes : inspection.steeringNotes,
        fluidsStatus: fluidsStatus !== undefined ? fluidsStatus : inspection.fluidsStatus,
        fluidsNotes: fluidsNotes !== undefined ? fluidsNotes : inspection.fluidsNotes,
        beltsHosesStatus: beltsHosesStatus !== undefined ? beltsHosesStatus : inspection.beltsHosesStatus,
        beltsHosesNotes: beltsHosesNotes !== undefined ? beltsHosesNotes : inspection.beltsHosesNotes,
        batteryStatus: batteryStatus !== undefined ? batteryStatus : inspection.batteryStatus,
        batteryNotes: batteryNotes !== undefined ? batteryNotes : inspection.batteryNotes,
        overallStatus: overallStatus !== undefined ? overallStatus : inspection.overallStatus,
        overallNotes: overallNotes !== undefined ? overallNotes : inspection.overallNotes,
        recommendations: recommendations !== undefined ? recommendations : inspection.recommendations,
        customerSignature: customerSignature !== undefined ? customerSignature : inspection.customerSignature,
        inspectorSignature: inspectorSignature !== undefined ? inspectorSignature : inspection.inspectorSignature,
        isComplete: isComplete !== undefined ? isComplete : inspection.isComplete,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating inspection checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update inspection checklist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.inspectionChecklist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inspection checklist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete inspection checklist' },
      { status: 500 }
    );
  }
}

