import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const serviceTypeId = searchParams.get('serviceTypeId');
    const jobTemplateId = searchParams.get('jobTemplateId');
    const componentName = searchParams.get('componentName');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId;
    }

    if (jobTemplateId) {
      where.jobTemplateId = jobTemplateId;
    }

    if (componentName) {
      where.componentName = {
        contains: componentName,
        mode: 'insensitive',
      };
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const torqueSpecs = await prisma.torqueSpec.findMany({
      where,
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
      orderBy: [
        { componentName: 'asc' },
        { torqueValue: 'asc' },
      ],
    });

    return NextResponse.json(torqueSpecs);
  } catch (error: any) {
    console.error('Error fetching torque specs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch torque specs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!componentName || torqueValue === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: componentName, torqueValue, unit' },
        { status: 400 }
      );
    }

    const torqueSpec = await prisma.torqueSpec.create({
      data: {
        componentName,
        torqueValue: Number(torqueValue),
        unit: unit || 'ft-lbs',
        sequence: sequence || null,
        notes: notes || null,
        vehicleId: vehicleId || null,
        serviceTypeId: serviceTypeId || null,
        jobTemplateId: jobTemplateId || null,
        isActive: isActive !== undefined ? isActive : true,
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

    return NextResponse.json(torqueSpec, { status: 201 });
  } catch (error: any) {
    console.error('Error creating torque spec:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create torque spec' },
      { status: 500 }
    );
  }
}

