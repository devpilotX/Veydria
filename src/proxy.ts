import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// When no Clerk keys are set and we are not in production, the app runs a local
// demo against the seeded workspace. In that case the dashboard is open so you
// can look around without signing in. As soon as real Clerk keys are present,
// or in production, the dashboard requires a session again.
const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const demoModeOpen = process.env.NODE_ENV !== 'production' && !hasClerkKeys;

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req) && !demoModeOpen) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk's internal routes
    '/__clerk/:path*'
  ]
};
