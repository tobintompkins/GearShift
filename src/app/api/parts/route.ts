import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PartFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
    }
    
    if (category) {
      where.category = category;
    }
    
    // Note: SQLite doesn't support comparing columns directly in where clause
    // We'll filter low stock items in JavaScript after fetching

    let parts = await prisma.part.findMany({
      where,
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5, // Get last 5 purchases
        },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Filter low stock items if requested
    if (lowStock) {
      parts = parts.filter(part => part.quantity <= part.minQuantity);
    }

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: PartFormData = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Part name is required' },
        { status: 400 }
      );
    }

    if (!prisma.part) {
      console.error('Part model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'Part model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const part = await prisma.part.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        partNumber: data.partNumber?.trim() || null,
        vendor: data.vendor?.trim() || null,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity || 0,
        unit: data.unit?.trim() || null,
        price: data.price || null,
        location: data.location?.trim() || null,
        category: data.category?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        purchaseHistory: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error: any) {
    console.error('Error creating part:', error);
    if (error.message?.includes('part') || error.message?.includes('parts') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Part model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create part' },
      { status: 500 }
    );
  }
}


