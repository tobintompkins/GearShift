import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('API Login attempt for:', username);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    console.log('API Login result:', result);

    if (!result || !result.ok) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Return success - the session cookie should be set by NextAuth
    return NextResponse.json({ 
      success: true,
      redirect: '/dashboard'
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}


