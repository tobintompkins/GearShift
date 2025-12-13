import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VehicleMaintenanceHistoryFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenance = await prisma.vehicleMaintenanceHistory.findUnique({
      where: { id: params.id },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            date: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error('Error fetching maintenance record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch maintenance record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: VehicleMaintenanceHistoryFormData = await request.json();

    if (!data.serviceType || !data.serviceDate || data.mileage === undefined) {
      return NextResponse.json(
        { error: 'Service type, date, and mileage are required' },
        { status: 400 }
      );
    }

    const maintenance = await prisma.vehicleMaintenanceHistory.update({
      where: { id: params.id },
      data: {
        vehicleId: data.vehicleId,
        jobId: data.jobId || null,
        serviceType: data.serviceType,
        serviceDate: new Date(data.serviceDate),
        mileage: data.mileage,
        description: data.description || null,
        recommendations: data.recommendations || null,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        cost: data.cost || null,
        technician: data.technician || null,
        notes: data.notes || null,
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null,
        nextServiceMileage: data.nextServiceMileage || null,
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            date: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
      },
    });

    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error('Error updating maintenance record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update maintenance record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vehicleMaintenanceHistory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting maintenance record:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete maintenance record' },
      { status: 500 }
    );
  }
}


