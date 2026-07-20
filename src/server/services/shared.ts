import { z } from 'zod';

/** Standard pagination inputs shared by every list endpoint. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export type Pagination = z.infer<typeof paginationSchema>;

export function pageOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Picks a sort direction helper from a value, defaulting to descending. */
export function sortDir(value: string | undefined): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc';
}
