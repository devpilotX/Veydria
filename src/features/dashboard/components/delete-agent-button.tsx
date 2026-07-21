'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * Deletes an agent after a two step confirm, then sends the person back to the
 * agents list. The service layer appends the agent.deleted audit entry.
 * Deleting an agent needs the admin role, matching the API route.
 */
export function DeleteAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not delete the agent.');
      }
      toast.success(`${agentName} deleted.`);
      router.push('/dashboard/agents');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant='outline' size='sm' onClick={() => setConfirming(true)}>
        <Icons.trash className='h-4 w-4' />
        Delete
      </Button>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <Button variant='destructive' size='sm' onClick={onDelete} isLoading={pending}>
        Confirm delete
      </Button>
      <Button variant='ghost' size='sm' onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}
