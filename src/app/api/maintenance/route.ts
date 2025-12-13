import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VehicleMaintenanceHistoryFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const serviceType = searchParams.get('serviceType');
    const jobId = searchParams.get('jobId');

    const where: any = {};

    if (vehicleId && vehicleId !== 'all') {
      where.vehicleId = vehicleId;
    }

    if (serviceType && serviceType !== 'all') {
      where.serviceType = serviceType;
    }

    if (jobId && jobId !== 'all') {
      where.jobId = jobId;
    }

    const maintenance = await prisma.vehicleMaintenanceHistory.findMany({
      where,
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
      orderBy: [
        { serviceDate: 'desc' },
      ],
    });

    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error('Error fetching maintenance history:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch maintenance history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: VehicleMaintenanceHistoryFormData = await request.json();

    if (!data.vehicleId || !data.serviceType || !data.serviceDate || data.mileage === undefined) {
      return NextResponse.json(
        { error: 'Vehicle, service type, date, and mileage are required' },
        { status: 400 }
      );
    }

    const maintenance = await prisma.vehicleMaintenanceHistory.create({
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

    return NextResponse.json(maintenance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance record:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create maintenance record' },
      { status: 500 }
    );
  }
}


