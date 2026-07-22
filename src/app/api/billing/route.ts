import { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { createCheckoutSession, createPortalSession } from '@/server/services/billing';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
  returnUrl: z.string().url(),
  action: z.literal('checkout').optional()
});

const portalSchema = z.object({
  action: z.literal('portal'),
  returnUrl: z.string().url()
});

const bodySchema = z.discriminatedUnion('action', [
  checkoutSchema.extend({ action: z.literal('checkout') }),
  portalSchema
]);

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    const body = bodySchema.parse(await readJsonBody(request));
    if (body.action === 'portal') {
      return ok({ url: await createPortalSession(ctx, body.returnUrl) });
    }
    return ok({ url: await createCheckoutSession(ctx, body.plan, body.returnUrl) });
  });
}
