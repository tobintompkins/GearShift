import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { QuoteFormData } from '@/lib/types';

// Generate unique quote number
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: {
      quoteNumber: {
        startsWith: `Q-${year}-`,
      },
    },
  });
  const number = String(count + 1).padStart(3, '0');
  return `Q-${year}-${number}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
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

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: QuoteFormData = await request.json();

    if (!data.customerName || !data.vehicleInfo) {
      return NextResponse.json(
        { error: 'Customer name and vehicle info are required' },
        { status: 400 }
      );
    }

    if (!prisma.quote) {
      console.error('Quote model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'Quote model not available. Please restart your development server.' },
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

    const subtotal = laborTotal + partsTotal;
    const taxRate = data.taxRate || 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote with line items
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    if (error.message?.includes('quote') || error.message?.includes('quotes') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Quote model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create quote' },
      { status: 500 }
    );
  }
}


