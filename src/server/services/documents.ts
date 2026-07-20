import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { documents } from '@/db/schema';
import type { TenantContext } from '@/lib/auth/tenant';
import { notFound } from '@/lib/api/errors';
import { appendAuditLog } from './audit';
import { paginated, paginationSchema, pageOffset } from './shared';

export const listDocumentsSchema = paginationSchema.extend({
  aiSystemId: z.string().uuid().optional(),
  type: z
    .enum([
      'risk_assessment',
      'annex_iv',
      'model_card',
      'audit_report',
      'dpia',
      'conformity_declaration'
    ])
    .optional(),
  status: z.enum(['draft', 'final', 'archived']).optional()
});

export const updateDocumentSchema = z.object({
  status: z.enum(['draft', 'final', 'archived']).optional(),
  title: z.string().min(2).max(300).optional()
});

export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export async function listDocuments(ctx: TenantContext, input: ListDocumentsInput) {
  const where = and(
    eq(documents.organizationId, ctx.organizationId),
    input.aiSystemId ? eq(documents.aiSystemId, input.aiSystemId) : undefined,
    input.type ? eq(documents.type, input.type) : undefined,
    input.status ? eq(documents.status, input.status) : undefined
  );
  const [items, [totals]] = await Promise.all([
    db
      .select({
        id: documents.id,
        aiSystemId: documents.aiSystemId,
        type: documents.type,
        title: documents.title,
        status: documents.status,
        version: documents.version,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt
      })
      .from(documents)
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(input.pageSize)
      .offset(pageOffset(input.page, input.pageSize)),
    db.select({ value: count() }).from(documents).where(where)
  ]);
  return paginated(items, totals?.value ?? 0, input.page, input.pageSize);
}

export async function getDocument(ctx: TenantContext, id: string) {
  const row = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.organizationId, ctx.organizationId))
  });
  if (!row) throw notFound('That document does not exist.');
  return row;
}

export async function updateDocument(ctx: TenantContext, id: string, input: UpdateDocumentInput) {
  await getDocument(ctx, id);
  const [row] = await db
    .update(documents)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.organizationId, ctx.organizationId)))
    .returning();

  await appendAuditLog({
    organizationId: ctx.organizationId,
    actorType: ctx.userId ? 'user' : 'system',
    actorId: ctx.clerkUserId,
    action: 'document.updated',
    resourceType: 'document',
    resourceId: row.id,
    data: { status: row.status }
  });
  return row;
}
