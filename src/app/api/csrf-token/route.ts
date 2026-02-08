import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/utils/csrf';

/**
 * CSRF Token Generation Endpoint
 * Provides tokens for client-side CSRF protection
 */
export async function GET() {
  try {
    const token = generateCSRFToken();
    
    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
