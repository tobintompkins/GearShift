import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NoteFormData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: NoteFormData & { isCompleted?: boolean } = await request.json();

    if (!data.title || !data.category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      title: data.title.trim(),
      content: data.content?.trim() || null,
      category: data.category,
      priority: data.priority || 'normal',
      isDailyTask: data.isDailyTask !== undefined ? data.isDailyTask : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      relatedJobId: data.relatedJobId || null,
      relatedCustomerId: data.relatedCustomerId || null,
      relatedPartId: data.relatedPartId || null,
    };

    // Handle completion status
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      if (data.isCompleted && !updateData.completedAt) {
        updateData.completedAt = new Date();
      } else if (!data.isCompleted) {
        updateData.completedAt = null;
      }
    }

    const note = await prisma.note.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}


