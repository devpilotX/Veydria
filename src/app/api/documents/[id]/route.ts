import { NextRequest } from 'next/server';
import { handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import { getDocument, updateDocument, updateDocumentSchema } from '@/server/services/documents';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const { id } = await params;
    return ok(await getDocument(ctx, id));
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    const { id } = await params;
    const input = updateDocumentSchema.parse(await readJsonBody(request));
    return ok(await updateDocument(ctx, id, input));
  });
}
