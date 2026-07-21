'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { RiskBadge } from '@/components/dashboard/badges';

const inputClass =
  'border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

type CreateResult = {
  id: string;
  name: string;
  riskTier: string;
  obligationsCreated: number;
};

export function NewSystemForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);

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
      const data = (await response.json()) as CreateResult;
      setResult(data);
      toast.success('System created and classified.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  async function retryClassify() {
    if (!result) return;
    setRetrying(true);
    try {
      const response = await fetch(`/api/ai-systems/${result.id}/classify`, { method: 'POST' });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Classification failed.');
      }
      const data = (await response.json()) as { riskTier: string; obligationsCreated: number };
      setResult((prev) =>
        prev
          ? { ...prev, riskTier: data.riskTier, obligationsCreated: data.obligationsCreated }
          : prev
      );
      toast.success('Classification updated.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setRetrying(false);
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className='space-y-5 pt-6'>
          <div className='flex items-center gap-2'>
            <Icons.circleCheck className='size-5 text-emerald-600 dark:text-emerald-400' />
            <h2 className='text-lg font-medium'>{result.name} is set up</h2>
          </div>

          <div className='flex items-center gap-3 text-sm'>
            <span className='text-muted-foreground'>Risk tier</span>
            <RiskBadge tier={result.riskTier} />
          </div>

          {result.obligationsCreated > 0 ? (
            <p className='text-muted-foreground text-sm'>
              Generated {result.obligationsCreated} obligation
              {result.obligationsCreated === 1 ? '' : 's'} from the knowledge base, ready to work.
            </p>
          ) : (
            <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm'>
              <p className='font-medium text-amber-700 dark:text-amber-400'>
                No obligations were generated
              </p>
              <p className='text-muted-foreground mt-1'>
                That is unusual. It can happen if the regulations knowledge base is incomplete.
                Classify again to try once more.
              </p>
              <div className='mt-3'>
                <Button variant='outline' size='sm' onClick={retryClassify} isLoading={retrying}>
                  Retry classification
                </Button>
              </div>
            </div>
          )}

          <div className='flex flex-wrap gap-2 pt-1'>
            <Button render={<Link href={`/dashboard/systems/${result.id}`} />}>View system</Button>
            {result.obligationsCreated > 0 && (
              <Button
                variant='outline'
                render={<Link href={`/dashboard/obligations?aiSystemId=${result.id}`} />}
              >
                View obligations
              </Button>
            )}
            <Button variant='ghost' onClick={() => setResult(null)}>
              Add another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
