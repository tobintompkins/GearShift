import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ServiceTemplateFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!prisma.serviceTemplate) {
      return NextResponse.json(
        { error: 'ServiceTemplate model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const service = await prisma.serviceTemplate.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Error fetching service template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch service template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!prisma.serviceTemplate) {
      return NextResponse.json(
        { error: 'ServiceTemplate model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const data: ServiceTemplateFormData = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      );
    }

    const service = await prisma.serviceTemplate.update({
      where: { id: params.id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        duration: data.duration || null,
        price: data.price || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Error updating service template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update service template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!prisma.serviceTemplate) {
      return NextResponse.json(
        { error: 'ServiceTemplate model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    await prisma.serviceTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting service template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete service template' },
      { status: 500 }
    );
  }
}


