import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ToolFormData } from '@/lib/types';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolType = searchParams.get('toolType');
    const condition = searchParams.get('condition');
    const assignedToId = searchParams.get('assignedToId');
    const calibrationDue = searchParams.get('calibrationDue'); // 'overdue' or 'due-soon'
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (toolType && toolType !== 'all') {
      where.toolType = toolType;
    }

    if (condition && condition !== 'all') {
      where.condition = condition;
    }

    if (assignedToId && assignedToId !== 'all' && assignedToId !== 'unassigned') {
      where.assignedToId = assignedToId;
    } else if (assignedToId === 'unassigned') {
      where.assignedToId = null;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    if (calibrationDue === 'overdue') {
      where.calibrationDueDate = {
        lt: new Date(),
      };
      where.calibrationDueDate = {
        ...where.calibrationDueDate,
        not: null,
      };
    } else if (calibrationDue === 'due-soon') {
      const thirtyDaysFromNow = addDays(new Date(), 30);
      where.calibrationDueDate = {
        gte: new Date(),
        lte: thirtyDaysFromNow,
      };
    }

    const tools = await prisma.tool.findMany({
      where,
      include: {
        assignedTo: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json(tools);
  } catch (error: any) {
    console.error('Error fetching tools:', error);
    
    // Check if it's a database schema error
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ToolFormData = await request.json();

    // Calculate calibration due date if calibration date and interval are provided
    let calibrationDueDate = data.calibrationDueDate ? new Date(data.calibrationDueDate) : null;
    if (data.calibrationDate && data.calibrationInterval && !calibrationDueDate) {
      calibrationDueDate = addDays(new Date(data.calibrationDate), data.calibrationInterval);
    }

    const tool = await prisma.tool.create({
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

    return NextResponse.json(tool, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tool:', error);
    
    // Check if it's a database schema error
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create tool' },
      { status: 500 }
    );
  }
}


