import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    const where: any = {};
    
    if (customerId) {
      where.customerId = customerId;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: [
        { year: 'desc' },
        { make: 'asc' },
        { model: 'asc' },
      ],
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


