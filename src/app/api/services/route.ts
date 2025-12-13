import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ServiceTemplateFormData } from '@/lib/types';

export async function GET() {
  try {
    // Check if serviceTemplate model exists in Prisma client
    if (!prisma.serviceTemplate) {
      console.error('ServiceTemplate model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'ServiceTemplate model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const services = await prisma.serviceTemplate.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Error fetching service templates:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('serviceTemplate') || error.message?.includes('service_templates')) {
      return NextResponse.json(
        { error: 'ServiceTemplate model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch service templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if serviceTemplate model exists in Prisma client
    if (!prisma.serviceTemplate) {
      console.error('ServiceTemplate model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'ServiceTemplate model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const data: ServiceTemplateFormData = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      );
    }

    const service = await prisma.serviceTemplate.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        duration: data.duration || null,
        price: data.price || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service template:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('serviceTemplate') || error.message?.includes('service_templates') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'ServiceTemplate model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create service template' },
      { status: 500 }
    );
  }
}


