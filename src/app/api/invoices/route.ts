import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InvoiceFormData } from '@/lib/types';

// Generate unique invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
  });
  const number = String(count + 1).padStart(3, '0');
  return `INV-${year}-${number}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const jobId = searchParams.get('jobId');
    const unpaid = searchParams.get('unpaid') === 'true';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (jobId) {
      where.jobId = jobId;
    }
    
    if (unpaid) {
      where.status = {
        in: ['pending', 'partial', 'overdue'],
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: InvoiceFormData = await request.json();

    if (!data.customerName || !data.vehicleInfo) {
      return NextResponse.json(
        { error: 'Customer name and vehicle info are required' },
        { status: 400 }
      );
    }

    if (!prisma.invoice) {
      console.error('Invoice model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'Invoice model not available. Please restart your development server.' },
        { status: 500 }
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

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice with line items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        jobId: data.jobId || null,
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
        balanceDue: total, // Initially, balance due equals total
        amountPaid: 0,
        status: data.status || 'pending',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paymentMethod: data.paymentMethod?.trim() || null,
        notes: data.notes?.trim() || null,
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    if (error.message?.includes('invoice') || error.message?.includes('invoices') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Invoice model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}


