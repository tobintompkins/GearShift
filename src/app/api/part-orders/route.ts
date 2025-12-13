import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PartOrderFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const vendor = searchParams.get('vendor');
    const jobId = searchParams.get('jobId');
    const overdue = searchParams.get('overdue') === 'true';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (vendor) {
      where.vendor = vendor;
    }
    
    if (jobId) {
      where.jobId = jobId;
    }

    const partOrders = await prisma.partOrder.findMany({
      where,
      include: {
        job: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
        part: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter overdue orders (past delivery ETA and status is not arrived/installed)
    let filteredOrders = partOrders;
    if (overdue) {
      const now = new Date();
      filteredOrders = partOrders.filter(order => {
        if (!order.deliveryETA) return false;
        const eta = new Date(order.deliveryETA);
        return eta < now && order.status !== 'arrived' && order.status !== 'installed';
      });
    }

    return NextResponse.json(filteredOrders);
  } catch (error) {
    console.error('Error fetching part orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: PartOrderFormData = await request.json();

    if (!data.partName || !data.vendor) {
      return NextResponse.json(
        { error: 'Part name and vendor are required' },
        { status: 400 }
      );
    }

    if (!prisma.partOrder) {
      console.error('PartOrder model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'PartOrder model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const partOrder = await prisma.partOrder.create({
      data: {
        partName: data.partName.trim(),
        vendor: data.vendor.trim(),
        price: data.price || null,
        sku: data.sku?.trim() || null,
        deliveryETA: data.deliveryETA ? new Date(data.deliveryETA) : null,
        jobId: data.jobId || null,
        partId: data.partId || null,
        status: data.status || 'needed',
        quantity: data.quantity || 1,
        notes: data.notes?.trim() || null,
        orderedDate: data.orderedDate ? new Date(data.orderedDate) : null,
        arrivedDate: data.arrivedDate ? new Date(data.arrivedDate) : null,
        installedDate: data.installedDate ? new Date(data.installedDate) : null,
      },
      include: {
        job: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
        part: true,
      },
    });

    return NextResponse.json(partOrder, { status: 201 });
  } catch (error: any) {
    console.error('Error creating part order:', error);
    if (error.message?.includes('partOrder') || error.message?.includes('part_orders') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'PartOrder model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create part order' },
      { status: 500 }
    );
  }
}


