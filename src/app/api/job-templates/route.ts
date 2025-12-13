import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobTemplateFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const templates = await prisma.jobTemplate.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching job templates:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: JobTemplateFormData = await request.json();

    if (!data.name || !data.serviceType) {
      return NextResponse.json(
        { error: 'Name and service type are required' },
        { status: 400 }
      );
    }

    const template = await prisma.jobTemplate.create({
      data: {
        name: data.name,
        serviceType: data.serviceType,
        duration: data.duration || null,
        price: data.price || null,
        description: data.description || null,
        parts: data.parts || null,
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job template:', error);
    
    if (error.code === 'P2001' || error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database migration required. Please run: npx prisma db push' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create job template' },
      { status: 500 }
    );
  }
}


