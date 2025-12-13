import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PartOrderStatus } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (!status || !['needed', 'ordered', 'arrived', 'installed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (needed, ordered, arrived, installed)' },
        { status: 400 }
      );
    }

    // Get current order
    const currentOrder = await prisma.partOrder.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Part order not found' },
        { status: 404 }
      );
    }

    // Auto-update dates based on status
    let orderedDate = currentOrder.orderedDate;
    let arrivedDate = currentOrder.arrivedDate;
    let installedDate = currentOrder.installedDate;

    if (status === 'ordered' && !orderedDate) {
      orderedDate = new Date();
    }
    if (status === 'arrived' && !arrivedDate) {
      arrivedDate = new Date();
    }
    if (status === 'installed' && !installedDate) {
      installedDate = new Date();
    }

    const partOrder = await prisma.partOrder.update({
      where: { id: params.id },
      data: {
        status: status as PartOrderStatus,
        orderedDate,
        arrivedDate,
        installedDate,
      },
      include: {
        job: {
          include: {
            customer: true,
            vehicle: true,
            employee: true,
          },
        },
        part: true,
      },
    });

    return NextResponse.json(partOrder);
  } catch (error) {
    console.error('Error updating part order status:', error);
    return NextResponse.json(
      { error: 'Failed to update part order status' },
      { status: 500 }
    );
  }
}


