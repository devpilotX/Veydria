import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './errors';

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Wraps a route handler so ApiError and ZodError become tidy responses and
 * anything unexpected returns a 500 without leaking internals.
 */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'The request did not match what we expected.',
          code: 'validation_error',
          issues: error.issues
        },
        { status: 422 }
      );
    }
    console.error('Unhandled route error', error);
    return NextResponse.json(
      { error: 'Something went wrong on our side.', code: 'internal_error' },
      { status: 500 }
    );
  }
}
