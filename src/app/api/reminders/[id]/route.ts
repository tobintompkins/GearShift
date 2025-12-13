import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ReminderFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            customer: true,
            employee: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: Partial<ReminderFormData> = await request.json();

    const reminder = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        type: data.type,
        method: data.method,
        daysBefore: data.daysBefore,
        message: data.message?.trim() || null,
      },
      include: {
        job: {
          include: {
            customer: true,
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.reminder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}


