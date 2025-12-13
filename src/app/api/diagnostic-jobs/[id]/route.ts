import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const diagnosticJob = await prisma.diagnosticJob.findUnique({
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
            engine: true,
            mileage: true,
            licensePlate: true,
            vin: true,
            color: true,
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

    if (!diagnosticJob) {
      return NextResponse.json(
        { error: 'Diagnostic job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(diagnosticJob);
  } catch (error: any) {
    console.error('Error fetching diagnostic job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch diagnostic job' },
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

    const diagnosticJob = await prisma.diagnosticJob.findUnique({
      where: { id: params.id },
    });

    if (!diagnosticJob) {
      return NextResponse.json(
        { error: 'Diagnostic job not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.diagnosticJob.update({
      where: { id: params.id },
      data: {
        jobId: jobId !== undefined ? jobId : diagnosticJob.jobId,
        employeeId: employeeId !== undefined ? employeeId : diagnosticJob.employeeId,
        diagnosticDate: diagnosticDate ? new Date(diagnosticDate) : diagnosticJob.diagnosticDate,
        scanToolUsed: scanToolUsed !== undefined ? scanToolUsed : diagnosticJob.scanToolUsed,
        troubleCodes: troubleCodes !== undefined ? troubleCodes : diagnosticJob.troubleCodes,
        freezeFrameData: freezeFrameData !== undefined ? freezeFrameData : diagnosticJob.freezeFrameData,
        liveDataNotes: liveDataNotes !== undefined ? liveDataNotes : diagnosticJob.liveDataNotes,
        diagnosticConclusion: diagnosticConclusion !== undefined ? diagnosticConclusion : diagnosticJob.diagnosticConclusion,
        recommendedRepairs: recommendedRepairs !== undefined ? recommendedRepairs : diagnosticJob.recommendedRepairs,
        status: status !== undefined ? status : diagnosticJob.status,
        notes: notes !== undefined ? notes : diagnosticJob.notes,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating diagnostic job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update diagnostic job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.diagnosticJob.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting diagnostic job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete diagnostic job' },
      { status: 500 }
    );
  }
}

