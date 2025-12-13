import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            customerFirstName: true,
            customerLastName: true,
            date: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(timeEntry);
  } catch (error: any) {
    console.error('Error fetching time entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { jobId, notes } = body;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        jobId: jobId !== undefined ? jobId : timeEntry.jobId,
        notes: notes !== undefined ? notes : timeEntry.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        job: {
          select: {
            id: true,
            serviceType: true,
            customerFirstName: true,
            customerLastName: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating time entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update time entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.timeEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete time entry' },
      { status: 500 }
    );
  }
}

