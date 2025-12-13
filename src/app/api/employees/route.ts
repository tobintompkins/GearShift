import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EmployeeFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const employees = await prisma.employee.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: EmployeeFormData = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Check if employee model is available
    if (!prisma.employee) {
      console.error('Prisma employee model not available. Prisma client:', Object.keys(prisma));
      return NextResponse.json(
        { error: 'Database client not properly initialized. Please restart the development server.' },
        { status: 500 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        photo: data.photo?.trim() || null,
        skills: data.skills?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    
    // Check if it's a database schema error (table doesn't exist)
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma migrate dev --name add_employees' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}


