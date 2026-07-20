'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  async function createKey() {
    if (name.trim().length < 2) {
      toast.error('Give the key a name.');
      return;
    }
    setPending(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not create the key.');
      }
      const key = (await response.json()) as { plaintext: string };
      setFreshKey(key.plaintext);
      setName('');
      toast.success('Key created. Copy it now, it will not be shown again.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  async function revokeKey(id: string) {
    const response = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Key revoked.');
      router.refresh();
    } else {
      toast.error('Could not revoke the key.');
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='Key name, for example Production SDK'
          className='border-input bg-background h-9 w-72 rounded-md border px-3 text-sm'
        />
        <Button onClick={createKey} isLoading={pending}>
          <Icons.add className='h-4 w-4' />
          Create key
        </Button>
      </div>

      {freshKey && (
        <div className='rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3'>
          <p className='text-sm font-medium'>Copy your key now</p>
          <code className='mt-1 block text-sm break-all'>{freshKey}</code>
          <p className='text-muted-foreground mt-1 text-xs'>
            This is the only time we show it. Store it somewhere safe.
          </p>
        </div>
      )}

      <div className='divide-border divide-y rounded-md border'>
        {initialKeys.length === 0 ? (
          <p className='text-muted-foreground p-4 text-sm'>No API keys yet.</p>
        ) : (
          initialKeys.map((key) => (
            <div key={key.id} className='flex items-center justify-between p-3'>
              <div>
                <p className='text-sm font-medium'>
                  {key.name}{' '}
                  {key.revokedAt && (
                    <span className='text-muted-foreground text-xs'>(revoked)</span>
                  )}
                </p>
                <p className='text-muted-foreground font-mono text-xs'>{key.keyPrefix}...</p>
              </div>
              {!key.revokedAt && (
                <Button variant='outline' size='sm' onClick={() => revokeKey(key.id)}>
                  Revoke
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
