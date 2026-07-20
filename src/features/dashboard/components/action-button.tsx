'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type Props = {
  url: string;
  method?: 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  label: string;
  successMessage?: string;
  icon?: keyof typeof Icons;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

/**
 * Calls one of our API routes, then refreshes the server data. Used for small
 * mutations like classify, acknowledge, and generate so pages stay server
 * rendered but still act on a click.
 */
export function PostActionButton({
  url,
  method = 'POST',
  body,
  label,
  successMessage,
  icon,
  variant = 'default',
  size = 'sm'
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const Icon = icon ? Icons[icon] : null;

  async function run() {
    setPending(true);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'That did not work.');
      }
      toast.success(successMessage ?? 'Done.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={run} isLoading={pending}>
      {Icon && <Icon className='h-4 w-4' />}
      {label}
    </Button>
  );
}
