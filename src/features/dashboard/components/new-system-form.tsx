'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const inputClass =
  'border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

export function NewSystemForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      purpose: String(form.get('purpose') ?? '').trim() || undefined,
      domain: String(form.get('domain') ?? '').trim() || undefined,
      deploymentContext: String(form.get('deploymentContext') ?? '') || undefined,
      actorRole: String(form.get('actorRole') ?? 'provider')
    };
    if (payload.name.length < 2) {
      toast.error('Give the system a name.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/ai-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not create the system.');
      }
      const system = (await response.json()) as { id: string };
      // Classify right away so the obligations are ready when the page opens.
      await fetch(`/api/ai-systems/${system.id}/classify`, { method: 'POST' }).catch(() => null);
      toast.success('System created and classified.');
      router.push(`/dashboard/systems/${system.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <form onSubmit={onSubmit} className='max-w-2xl space-y-4'>
          <div className='space-y-1.5'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name
            </label>
            <input
              id='name'
              name='name'
              className={inputClass}
              placeholder='Resume Screening Assistant'
            />
          </div>
          <div className='space-y-1.5'>
            <label htmlFor='purpose' className='text-sm font-medium'>
              What it does
            </label>
            <textarea
              id='purpose'
              name='purpose'
              rows={3}
              className={inputClass.replace('h-9', 'min-h-20 py-2')}
              placeholder='Ranks job applicants for recruiters so the strongest are reviewed first.'
            />
            <p className='text-muted-foreground text-xs'>
              Be specific. The classifier reads this to decide the risk tier.
            </p>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label htmlFor='domain' className='text-sm font-medium'>
                Domain
              </label>
              <input
                id='domain'
                name='domain'
                className={inputClass}
                placeholder='hr, fintech, health'
              />
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='deploymentContext' className='text-sm font-medium'>
                Deployment
              </label>
              <select
                id='deploymentContext'
                name='deploymentContext'
                className={inputClass}
                defaultValue='customer_facing'
              >
                <option value='customer_facing'>Customer facing</option>
                <option value='internal'>Internal</option>
                <option value='research'>Research</option>
              </select>
            </div>
          </div>
          <div className='space-y-1.5'>
            <label htmlFor='actorRole' className='text-sm font-medium'>
              Your role
            </label>
            <select id='actorRole' name='actorRole' className={inputClass} defaultValue='provider'>
              <option value='provider'>Provider, we built it</option>
              <option value='deployer'>Deployer, we use a vendor system</option>
            </select>
          </div>
          <div className='flex gap-2'>
            <Button type='submit' isLoading={pending}>
              Create and classify
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
