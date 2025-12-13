import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get photo record
    const photo = await prisma.jobPhoto.findUnique({
      where: { id: params.id },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const filepath = join(process.cwd(), 'public', photo.filepath);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    // Delete from database
    await prisma.jobPhoto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const photo = await prisma.jobPhoto.update({
      where: { id: params.id },
      data: {
        photoType: data.photoType || undefined,
        description: data.description !== undefined ? data.description : undefined,
      },
    });

    return NextResponse.json(photo);
  } catch (error: any) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update photo' },
      { status: 500 }
    );
  }
}

