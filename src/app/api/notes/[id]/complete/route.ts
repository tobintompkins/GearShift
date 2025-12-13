import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { completed } = await request.json();

    const note = await prisma.note.update({
      where: { id: params.id },
      data: {
        isCompleted: completed !== false,
        completedAt: completed !== false ? new Date() : null,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note completion:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

