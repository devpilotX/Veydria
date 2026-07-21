'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const inputClass =
  'border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

const evaluationTypes = ['bias', 'hallucination', 'prompt_injection', 'safety', 'policy'];

export type AgentOption = { id: string; name: string };

/**
 * Triggers an evaluation through POST /api/evaluations, which scores the agent
 * on the evals service. When an agentId is fixed we hide the picker. On success
 * we go to the evaluation detail page. If the service was unavailable the run is
 * still recorded as an error and the detail page explains what happened.
 */
export function RunEvaluationForm({
  agents,
  agentId
}: {
  agents?: AgentOption[];
  agentId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosenAgent = agentId ?? String(form.get('agentId') ?? '');
    if (!chosenAgent) {
      toast.error('Pick an agent to evaluate.');
      return;
    }
    const payload = {
      agentId: chosenAgent,
      type: String(form.get('type') ?? 'bias'),
      threshold: Number(form.get('threshold') ?? 70)
    };

    setPending(true);
    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not start the evaluation.');
      }
      const data = (await response.json()) as { id: string; status: string; summary?: string };
      if (data.status === 'error') {
        toast.error(data.summary ?? 'The evaluation service was unavailable.');
      } else {
        toast.success('Evaluation finished.');
      }
      router.push(`/dashboard/evaluations/${data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='flex flex-wrap items-end gap-3'>
      {!agentId && agents ? (
        <div className='space-y-1.5'>
          <label htmlFor='agentId' className='text-sm font-medium'>
            Agent
          </label>
          <select
            id='agentId'
            name='agentId'
            className={`${inputClass} w-56`}
            defaultValue={agents[0]?.id ?? ''}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className='space-y-1.5'>
        <label htmlFor='type' className='text-sm font-medium'>
          Test
        </label>
        <select
          id='type'
          name='type'
          className={`${inputClass} w-48 capitalize`}
          defaultValue='bias'
        >
          {evaluationTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className='space-y-1.5'>
        <label htmlFor='threshold' className='text-sm font-medium'>
          Pass mark
        </label>
        <input
          id='threshold'
          name='threshold'
          type='number'
          min={0}
          max={100}
          defaultValue={70}
          className={`${inputClass} w-24`}
        />
      </div>

      <Button type='submit' isLoading={pending}>
        Run evaluation
      </Button>
    </form>
  );
}
