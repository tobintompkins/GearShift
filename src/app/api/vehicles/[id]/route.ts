import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { VehicleFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        jobs: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
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
      },
    });

    return NextResponse.json(vehicle);
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}


