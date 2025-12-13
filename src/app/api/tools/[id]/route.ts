import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ToolFormData } from '@/lib/types';
import { addDays } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
      },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: ToolFormData = await request.json();

    // Calculate calibration due date if calibration date and interval are provided
    let calibrationDueDate = data.calibrationDueDate ? new Date(data.calibrationDueDate) : null;
    if (data.calibrationDate && data.calibrationInterval && !calibrationDueDate) {
      calibrationDueDate = addDays(new Date(data.calibrationDate), data.calibrationInterval);
    }

    const tool = await prisma.tool.update({
      where: { id: params.id },
      data: {
        name: data.name,
        toolType: data.toolType,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        condition: data.condition || 'good',
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice || null,
        assignedToId: data.assignedToId || null,
        calibrationDate: data.calibrationDate ? new Date(data.calibrationDate) : null,
        calibrationDueDate,
        calibrationInterval: data.calibrationInterval || null,
        location: data.location || null,
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tool.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
}


