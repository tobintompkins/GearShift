import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the job to find related specs
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        vehicle: true,
        serviceTypeRef: true,
        quote: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Find torque specs that match:
    // 1. Vehicle-specific specs
    // 2. Service type specs
    // 3. Job template specs (if job was created from a template)
    const whereConditions: any[] = [];

    if (job.vehicleId) {
      whereConditions.push({ vehicleId: job.vehicleId });
    }

    if (job.serviceTypeId) {
      whereConditions.push({ serviceTypeId: job.serviceTypeId });
    }

    // If job has a quote, check if quote has a template
    // For now, we'll also check job templates by service type match
    if (job.serviceType) {
      // Find job templates that match this service type
      const matchingTemplates = await prisma.jobTemplate.findMany({
        where: {
          serviceType: job.serviceType,
          isActive: true,
        },
        select: { id: true },
      });

      if (matchingTemplates.length > 0) {
        whereConditions.push({
          jobTemplateId: { in: matchingTemplates.map((t) => t.id) },
        });
      }
    }

    // Get all matching torque specs
    const torqueSpecs = await prisma.torqueSpec.findMany({
      where: {
        OR: whereConditions.length > 0 ? whereConditions : [{ isActive: true }],
        isActive: true,
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
      orderBy: [
        { componentName: 'asc' },
        { torqueValue: 'asc' },
      ],
    });

    return NextResponse.json(torqueSpecs);
  } catch (error: any) {
    console.error('Error fetching torque specs for job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch torque specs' },
      { status: 500 }
    );
  }
}

