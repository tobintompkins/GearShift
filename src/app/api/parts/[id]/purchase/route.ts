import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PurchaseHistoryFormData } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: PurchaseHistoryFormData = await request.json();

    if (!data.quantity || data.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate total price if not provided
    const totalPrice = data.totalPrice || (data.unitPrice ? data.unitPrice * data.quantity : null);

    // Create purchase history record
    const purchase = await prisma.purchaseHistory.create({
      data: {
        partId: params.id,
        quantity: data.quantity,
        unitPrice: data.unitPrice || null,
        totalPrice: totalPrice,
        vendor: data.vendor?.trim() || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        notes: data.notes?.trim() || null,
      },
    });

    // Update part quantity
    await prisma.part.update({
      where: { id: params.id },
      data: {
        quantity: {
          increment: data.quantity,
        },
      },
    });

    // Fetch updated part with purchase history
    const part = await prisma.part.findUnique({
      where: { id: params.id },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
        },
      },
    });

    return NextResponse.json({ purchase, part }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording purchase:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record purchase' },
      { status: 500 }
    );
  }
}


