import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VehicleFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: VehicleFormData = await request.json();

    if (!data.make || !data.model) {
      return NextResponse.json(
        { error: 'Make and model are required' },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year?.trim() || null,
        engine: data.engine?.trim() || null,
        mileage: data.mileage || null,
        licensePlate: data.licensePlate?.trim() || null,
        vin: data.vin?.trim() || null,
        color: data.color?.trim() || null,
        notes: data.notes?.trim() || null,
        customerId: params.id,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}


