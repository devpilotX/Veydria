import { NextRequest } from 'next/server';
import { created, handleRoute, ok } from '@/lib/api/handler';
import { requireRole } from '@/lib/auth/require';
import { createApiKey, createApiKeySchema, listApiKeys } from '@/server/services/api-keys';

export async function GET() {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    return ok(await listApiKeys(ctx));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('admin');
    const input = createApiKeySchema.parse(await request.json());
    return created(await createApiKey(ctx, input));
  });
}
