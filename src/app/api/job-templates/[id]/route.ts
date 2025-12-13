import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JobTemplateFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.jobTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Job template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error fetching job template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: JobTemplateFormData = await request.json();

    if (!data.name || !data.serviceType) {
      return NextResponse.json(
        { error: 'Name and service type are required' },
        { status: 400 }
      );
    }

    const template = await prisma.jobTemplate.update({
      where: { id: params.id },
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

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating job template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.jobTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting job template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job template' },
      { status: 500 }
    );
  }
}


