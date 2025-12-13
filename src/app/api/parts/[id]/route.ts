import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PartFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const part = await prisma.part.findUnique({
      where: { id: params.id },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
        },
      },
    });

    if (!part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error fetching part:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: PartFormData = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Part name is required' },
        { status: 400 }
      );
    }

    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        partNumber: data.partNumber?.trim() || null,
        vendor: data.vendor?.trim() || null,
        quantity: data.quantity !== undefined ? data.quantity : undefined,
        minQuantity: data.minQuantity !== undefined ? data.minQuantity : undefined,
        unit: data.unit?.trim() || null,
        price: data.price || null,
        location: data.location?.trim() || null,
        category: data.category?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error updating part:', error);
    return NextResponse.json(
      { error: 'Failed to update part' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.part.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json(
      { error: 'Failed to delete part' },
      { status: 500 }
    );
  }
}


