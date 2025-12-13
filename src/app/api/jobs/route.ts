import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobFormData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const data: JobFormData = await request.json();

    const job = await prisma.job.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime || null,
        duration: data.duration || null,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        vehicleInfo: data.vehicleInfo,
        serviceType: data.serviceType,
        status: data.status,
        price: data.price || null,
        urgent: data.urgent || false,
        urgentType: data.urgentType || null,
        employeeId: data.employeeId || null,
        customerId: data.customerId || null,
        vehicleId: data.vehicleId || null,
      },
      include: {
        employee: true,
        customer: true,
        vehicle: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const urgent = searchParams.get('urgent');
    const urgentType = searchParams.get('urgentType');

    const where: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (urgent === 'true') {
      where.urgent = true;
    }

    if (urgentType && urgentType !== 'all') {
      where.urgentType = urgentType;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        employee: true,
        customer: true,
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}



