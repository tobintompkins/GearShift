import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const jobId = searchParams.get('jobId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.diagnosticDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const diagnosticJobs = await prisma.diagnosticJob.findMany({
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
            vin: true,
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
      orderBy: { diagnosticDate: 'desc' },
    });

    return NextResponse.json(diagnosticJobs);
  } catch (error: any) {
    console.error('Error fetching diagnostic jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch diagnostic jobs' },
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
      jobId,
      employeeId,
      diagnosticDate,
      scanToolUsed,
      troubleCodes,
      freezeFrameData,
      liveDataNotes,
      diagnosticConclusion,
      recommendedRepairs,
      status,
      notes,
    } = body;

    if (!customerId || !vehicleId || !diagnosticDate) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, vehicleId, diagnosticDate' },
        { status: 400 }
      );
    }

    const diagnosticJob = await prisma.diagnosticJob.create({
      data: {
        customerId,
        vehicleId,
        jobId: jobId || null,
        employeeId: employeeId || null,
        diagnosticDate: new Date(diagnosticDate),
        scanToolUsed: scanToolUsed || null,
        troubleCodes: troubleCodes || null,
        freezeFrameData: freezeFrameData || null,
        liveDataNotes: liveDataNotes || null,
        diagnosticConclusion: diagnosticConclusion || null,
        recommendedRepairs: recommendedRepairs || null,
        status: status || 'pending',
        notes: notes || null,
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
            vin: true,
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

    return NextResponse.json(diagnosticJob, { status: 201 });
  } catch (error: any) {
    console.error('Error creating diagnostic job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create diagnostic job' },
      { status: 500 }
    );
  }
}

