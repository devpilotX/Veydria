import { NextRequest } from 'next/server';
import { handleRoute, ok } from '@/lib/api/handler';
import { requireTenant } from '@/lib/auth/require';
import { listDocuments, listDocumentsSchema } from '@/server/services/documents';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listDocumentsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listDocuments(ctx, input));
  });
}
