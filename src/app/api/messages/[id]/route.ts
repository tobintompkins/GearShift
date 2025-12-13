import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CustomerMessageFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await prisma.customerMessage.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        job: {
          select: {
            id: true,
            serviceType: true,
            date: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: CustomerMessageFormData = await request.json();

    if (!data.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const message = await prisma.customerMessage.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId || null,
        jobId: data.jobId || null,
        quoteId: data.quoteId || null,
        messageType: data.messageType,
        subject: data.subject || null,
        content: data.content,
        direction: data.direction || 'outbound',
        channel: data.channel || 'app',
        status: data.status || 'sent',
        isWaitingReply: data.isWaitingReply || false,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        sentAt: data.sentAt ? new Date(data.sentAt) : new Date(),
        createdBy: data.createdBy || null,
        notes: data.notes || null,
      },
      include: {
        customer: true,
        job: {
          select: {
            id: true,
            serviceType: true,
            date: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customerMessage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}


