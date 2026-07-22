import { NextRequest } from 'next/server';
import { created, handleRoute, ok, readJsonBody } from '@/lib/api/handler';
import { requireRole, requireTenant } from '@/lib/auth/require';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { listDocuments, listDocumentsSchema } from '@/server/services/documents';
import { generateDocument, generateDocumentSchema } from '@/server/services/document-generator';

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireTenant();
    const input = listDocumentsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    return ok(await listDocuments(ctx, input));
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const ctx = await requireRole('member');
    enforceRateLimit(`document:${ctx.organizationId}`, 20, 60_000);
    const input = generateDocumentSchema.parse(await readJsonBody(request));
    return created(await generateDocument(ctx, input));
  });
}
