import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = await prisma.maintenanceReminder.findUnique({
      where: { id: params.id },
      include: {
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
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            licensePlate: true,
            vin: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error('Error fetching maintenance reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminder' },
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
      title,
      description,
      dueDate,
      dueMileage,
      currentMileage,
      status,
      notes,
    } = body;

    const reminder = await prisma.maintenanceReminder.findUnique({
      where: { id: params.id },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (dueMileage !== undefined) updateData.dueMileage = dueMileage;
    if (currentMileage !== undefined) updateData.currentMileage = currentMileage;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'sent') {
        updateData.lastSentAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.maintenanceReminder.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating maintenance reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.maintenanceReminder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting maintenance reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}

