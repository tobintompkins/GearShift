import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminder = await prisma.maintenanceReminder.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Update reminder status to 'sent' and record timestamp
    const updated = await prisma.maintenanceReminder.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        lastSentAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            licensePlate: true,
          },
        },
      },
    });

    // TODO: Integrate with email/SMS service to actually send the reminder
    // For now, we just mark it as sent and return the reminder data
    // In the future, you can add:
    // - Email sending via SendGrid/Gmail
    // - SMS sending via Twilio
    // - Create a CustomerMessage record

    return NextResponse.json({
      success: true,
      reminder: updated,
      message: 'Reminder marked as sent. Email/SMS integration can be added here.',
    });
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder' },
      { status: 500 }
    );
  }
}

