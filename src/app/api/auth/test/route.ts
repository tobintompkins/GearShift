import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Test NextAuth
    const hasSecret = !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      hasAuthSecret: hasSecret,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}


