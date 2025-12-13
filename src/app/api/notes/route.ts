import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NoteFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const completed = searchParams.get('completed');
    const isCompleted = searchParams.get('isCompleted');
    const priority = searchParams.get('priority');
    const isDailyTask = searchParams.get('isDailyTask');

    const where: any = {};
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (completed !== null) {
      where.isCompleted = completed === 'true';
    }
    
    if (isCompleted !== null) {
      where.isCompleted = isCompleted === 'true';
    }
    
    if (priority) {
      where.priority = priority;
    }

    if (isDailyTask !== null) {
      where.isDailyTask = isDailyTask === 'true';
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: NoteFormData = await request.json();

    if (!data.title || !data.category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    if (!prisma.note) {
      console.error('Note model not found in Prisma client. Please restart your dev server.');
      return NextResponse.json(
        { error: 'Note model not available. Please restart your development server.' },
        { status: 500 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title: data.title.trim(),
        content: data.content?.trim() || null,
        category: data.category,
        priority: data.priority || 'normal',
        isDailyTask: data.isDailyTask || false,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        relatedJobId: data.relatedJobId || null,
        relatedCustomerId: data.relatedCustomerId || null,
        relatedPartId: data.relatedPartId || null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    if (error.message?.includes('note') || error.message?.includes('notes') || error.message?.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        { error: 'Note model not found. Please restart your development server after running: npx prisma generate' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}


