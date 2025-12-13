import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CustomerMessageFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const jobId = searchParams.get('jobId');
    const quoteId = searchParams.get('quoteId');
    const messageType = searchParams.get('messageType');
    const status = searchParams.get('status');
    const waitingReply = searchParams.get('waitingReply') === 'true';
    const channel = searchParams.get('channel');

    const where: any = {};

    if (customerId && customerId !== 'all') {
      where.customerId = customerId;
    }

    if (jobId && jobId !== 'all') {
      where.jobId = jobId;
    }

    if (quoteId && quoteId !== 'all') {
      where.quoteId = quoteId;
    }

    if (messageType && messageType !== 'all') {
      where.messageType = messageType;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (waitingReply) {
      where.isWaitingReply = true;
    }

    if (channel && channel !== 'all') {
      where.channel = channel;
    }

    const messages = await prisma.customerMessage.findMany({
      where,
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
      orderBy: [
        { sentAt: 'desc' },
      ],
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: CustomerMessageFormData = await request.json();

    if (!data.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const message = await prisma.customerMessage.create({
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

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}


