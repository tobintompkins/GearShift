import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amountPaid, paymentMethod } = await request.json();

    if (amountPaid === undefined || amountPaid < 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Get current invoice
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!currentInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const newAmountPaid = amountPaid;
    const balanceDue = Math.max(0, currentInvoice.total - newAmountPaid);
    
    // Determine status
    let status = currentInvoice.status;
    let paidDate = currentInvoice.paidDate;

    if (balanceDue === 0 && newAmountPaid > 0) {
      status = 'paid';
      paidDate = new Date();
    } else if (newAmountPaid > 0 && newAmountPaid < currentInvoice.total) {
      status = 'partial';
      paidDate = null;
    } else if (newAmountPaid === 0) {
      status = 'pending';
      paidDate = null;
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue,
        status,
        paidDate,
        paymentMethod: paymentMethod?.trim() || currentInvoice.paymentMethod,
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
    console.error('Error updating invoice payment:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice payment' },
      { status: 500 }
    );
  }
}


