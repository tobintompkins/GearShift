import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const torqueSpec = await prisma.torqueSpec.findUnique({
      where: { id: params.id },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            engine: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        jobTemplate: {
          select: {
            id: true,
            name: true,
            serviceType: true,
            description: true,
          },
        },
      },
    });

    if (!torqueSpec) {
      return NextResponse.json(
        { error: 'Torque spec not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(torqueSpec);
  } catch (error: any) {
    console.error('Error fetching torque spec:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch torque spec' },
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
      componentName,
      torqueValue,
      unit,
      sequence,
      notes,
      vehicleId,
      serviceTypeId,
      jobTemplateId,
      isActive,
    } = body;

    const torqueSpec = await prisma.torqueSpec.findUnique({
      where: { id: params.id },
    });

    if (!torqueSpec) {
      return NextResponse.json(
        { error: 'Torque spec not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.torqueSpec.update({
      where: { id: params.id },
      data: {
        componentName: componentName !== undefined ? componentName : torqueSpec.componentName,
        torqueValue: torqueValue !== undefined ? Number(torqueValue) : torqueSpec.torqueValue,
        unit: unit !== undefined ? unit : torqueSpec.unit,
        sequence: sequence !== undefined ? sequence : torqueSpec.sequence,
        notes: notes !== undefined ? notes : torqueSpec.notes,
        vehicleId: vehicleId !== undefined ? vehicleId : torqueSpec.vehicleId,
        serviceTypeId: serviceTypeId !== undefined ? serviceTypeId : torqueSpec.serviceTypeId,
        jobTemplateId: jobTemplateId !== undefined ? jobTemplateId : torqueSpec.jobTemplateId,
        isActive: isActive !== undefined ? isActive : torqueSpec.isActive,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
          },
        },
        jobTemplate: {
          select: {
            id: true,
            name: true,
            serviceType: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating torque spec:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update torque spec' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.torqueSpec.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting torque spec:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete torque spec' },
      { status: 500 }
    );
  }
}

