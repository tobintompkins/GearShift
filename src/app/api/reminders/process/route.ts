import { NextRequest, NextResponse } from 'next/server';
import { processReminders } from '@/lib/reminders';

// This endpoint can be called by:
// 1. Vercel Cron Jobs (vercel.json)
// 2. External cron services (cron-job.org, EasyCron, etc.)
// 3. Manual trigger for testing

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = await processReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        sent: results.sent,
        failed: results.failed,
        total: results.sent + results.failed,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error('Error in reminder processing endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}


