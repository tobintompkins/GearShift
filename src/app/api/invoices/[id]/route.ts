import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InvoiceFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicle: true,
        job: {
          include: {
            employee: true,
          },
        },
        lineItems: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: InvoiceFormData & { amountPaid?: number; status?: string } = await request.json();

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

    const shopSupplies = data.shopSupplies || 0;
    const subtotal = laborTotal + partsTotal + shopSupplies;

    // Apply discounts
    const discountAmount = data.discountAmount || 0;
    const discountPercent = data.discountPercent || 0;
    const discountTotal = discountAmount + (subtotal * discountPercent / 100);
    const afterDiscount = Math.max(0, subtotal - discountTotal);

    // Calculate tax
    const taxRate = data.taxRate || 0;
    const taxAmount = afterDiscount * taxRate;
    const total = afterDiscount + taxAmount;

    // Handle payment
    const amountPaid = data.amountPaid !== undefined ? data.amountPaid : undefined;
    const status = data.status || undefined;
    let balanceDue = total;
    let paidDate = null;

    if (amountPaid !== undefined) {
      balanceDue = Math.max(0, total - amountPaid);
      if (balanceDue === 0 && amountPaid > 0) {
        paidDate = new Date();
      }
    }

    // Delete existing line items and create new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: params.id },
    });

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId || null,
        vehicleId: data.vehicleId || null,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone?.trim() || null,
        customerEmail: data.customerEmail?.trim() || null,
        customerAddress: data.customerAddress?.trim() || null,
        vehicleInfo: data.vehicleInfo.trim(),
        laborHours,
        laborRate,
        laborTotal,
        partsTotal,
        shopSupplies,
        subtotal,
        discountAmount,
        discountPercent,
        taxRate,
        taxAmount,
        total,
        amountPaid: amountPaid !== undefined ? amountPaid : undefined,
        balanceDue: amountPaid !== undefined ? balanceDue : undefined,
        status: status || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paymentMethod: data.paymentMethod?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        paidDate: paidDate || undefined,
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
        job: true,
        lineItems: {
          include: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}


