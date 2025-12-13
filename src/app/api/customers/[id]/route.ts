import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CustomerFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
        jobs: {
          include: {
            employee: true,
            vehicle: true,
          },
          orderBy: [
            { date: 'desc' },
            { startTime: 'desc' },
          ],
        },
        _count: {
          select: {
            jobs: true,
            vehicles: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: CustomerFormData = await request.json();

    if (!data.firstName || !data.lastName || !data.phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: {
        _count: {
          select: {
            jobs: true,
            vehicles: true,
          },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A customer with this phone number already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}


