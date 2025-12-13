import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PartOrderFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partOrder = await prisma.partOrder.findUnique({
      where: { id: params.id },
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

    if (!partOrder) {
      return NextResponse.json(
        { error: 'Part order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(partOrder);
  } catch (error) {
    console.error('Error fetching part order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: PartOrderFormData = await request.json();

    if (!data.partName || !data.vendor) {
      return NextResponse.json(
        { error: 'Part name and vendor are required' },
        { status: 400 }
      );
    }

    // Auto-update dates based on status changes
    const currentOrder = await prisma.partOrder.findUnique({
      where: { id: params.id },
    });

    let orderedDate = data.orderedDate ? new Date(data.orderedDate) : currentOrder?.orderedDate || null;
    let arrivedDate = data.arrivedDate ? new Date(data.arrivedDate) : currentOrder?.arrivedDate || null;
    let installedDate = data.installedDate ? new Date(data.installedDate) : currentOrder?.installedDate || null;

    // Auto-set dates when status changes
    if (data.status && currentOrder) {
      if (data.status === 'ordered' && !orderedDate) {
        orderedDate = new Date();
      }
      if (data.status === 'arrived' && !arrivedDate) {
        arrivedDate = new Date();
      }
      if (data.status === 'installed' && !installedDate) {
        installedDate = new Date();
      }
    }

    const partOrder = await prisma.partOrder.update({
      where: { id: params.id },
      data: {
        partName: data.partName.trim(),
        vendor: data.vendor.trim(),
        price: data.price !== undefined ? data.price : undefined,
        sku: data.sku?.trim() || undefined,
        deliveryETA: data.deliveryETA ? new Date(data.deliveryETA) : undefined,
        jobId: data.jobId || undefined,
        partId: data.partId || undefined,
        status: data.status || undefined,
        quantity: data.quantity !== undefined ? data.quantity : undefined,
        notes: data.notes?.trim() || undefined,
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
    console.error('Error updating part order:', error);
    return NextResponse.json(
      { error: 'Failed to update part order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.partOrder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting part order:', error);
    return NextResponse.json(
      { error: 'Failed to delete part order' },
      { status: 500 }
    );
  }
}


