import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { sendSMS, isSMSConfigured } from '@/lib/sms';

export async function GET(request: NextRequest) {
  try {
    const testEmail = request.nextUrl.searchParams.get('email');
    const testPhone = request.nextUrl.searchParams.get('phone');

    const results: any = {
      email: {
        configured: isEmailConfigured(),
        tested: false,
        success: false,
        error: null,
      },
      sms: {
        configured: isSMSConfigured(),
        tested: false,
        success: false,
        error: null,
      },
    };

    // Test email if configured and email provided
    if (results.email.configured && testEmail) {
      try {
        results.email.tested = true;
        results.email.success = await sendEmail({
          to: testEmail,
          subject: 'Test Email from TNT Apex Elite AutoCare',
          text: 'This is a test email from TNT Apex Elite AutoCare. If you received this, your email configuration is working correctly!',
          html: '<p>This is a test email from TNT Apex Elite AutoCare. If you received this, your email configuration is working correctly!</p>',
        });
      } catch (error) {
        results.email.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test SMS if configured and phone provided
    if (results.sms.configured && testPhone) {
      try {
        results.sms.tested = true;
        results.sms.success = await sendSMS({
          to: testPhone,
          message: 'Test SMS from TNT Apex Elite AutoCare. Your SMS configuration is working!',
        });
      } catch (error) {
        results.sms.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Test completed. Check the results above.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


