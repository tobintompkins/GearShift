import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { QuoteFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicle: true,
        lineItems: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: QuoteFormData = await request.json();

    if (!data.customerName || !data.vehicleInfo) {
      return NextResponse.json(
        { error: 'Customer name and vehicle info are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const laborHours = data.laborHours || 0;
    const laborRate = data.laborRate || 0;
    const laborTotal = laborHours * laborRate;

    const lineItems = data.lineItems || [];
    const partsTotal = lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const subtotal = laborTotal + partsTotal;
    const taxRate = data.taxRate || 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Delete existing line items and create new ones
    await prisma.quoteLineItem.deleteMany({
      where: { quoteId: params.id },
    });

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId || null,
        vehicleId: data.vehicleId || null,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone?.trim() || null,
        customerEmail: data.customerEmail?.trim() || null,
        vehicleInfo: data.vehicleInfo.trim(),
        laborHours,
        laborRate,
        laborTotal,
        partsTotal,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: data.status || 'draft',
        notes: data.notes?.trim() || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        lineItems: {
          create: lineItems.map(item => ({
            partId: item.partId || null,
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        customer: true,
        vehicle: true,
        lineItems: {
          include: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.quote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}


