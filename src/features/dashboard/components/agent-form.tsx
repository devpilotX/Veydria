'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const inputClass =
  'border-input bg-background h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

const agentTypes = ['assistant', 'rag', 'autonomous', 'classifier', 'generator', 'workflow'];
const agentStatuses = ['active', 'paused', 'archived'];

export type SystemOption = { id: string; name: string };

export type AgentFormValues = {
  id: string;
  aiSystemId: string;
  name: string;
  description: string | null;
  type: string;
  modelProvider: string | null;
  modelName: string | null;
  systemPrompt: string | null;
  externalId: string | null;
  status: string;
};

/**
 * Creates or edits an agent. In create mode it posts to /api/agents; in edit
 * mode it patches /api/agents/[id]. The service layer appends the matching
 * agent.created or agent.updated audit entry. On success we send the person to
 * the agent detail page and refresh the server data.
 */
export function AgentForm({
  systems,
  agent
}: {
  systems: SystemOption[];
  agent?: AgentFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(agent);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      aiSystemId: String(form.get('aiSystemId') ?? ''),
      name: String(form.get('name') ?? '').trim(),
      type: String(form.get('type') ?? 'assistant'),
      modelProvider: String(form.get('modelProvider') ?? '').trim() || undefined,
      modelName: String(form.get('modelName') ?? '').trim() || undefined,
      description: String(form.get('description') ?? '').trim() || undefined,
      systemPrompt: String(form.get('systemPrompt') ?? '').trim() || undefined,
      externalId: String(form.get('externalId') ?? '').trim() || undefined
    };
    if (isEdit) payload.status = String(form.get('status') ?? 'active');

    if (String(payload.name).length < 2) {
      toast.error('Give the agent a name.');
      return;
    }
    if (!payload.aiSystemId) {
      toast.error('Pick the AI system this agent belongs to.');
      return;
    }

    setPending(true);
    try {
      const response = await fetch(isEdit ? `/api/agents/${agent?.id}` : '/api/agents', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Could not save the agent.');
      }
      const data = (await response.json()) as { id: string };
      toast.success(isEdit ? 'Agent saved.' : 'Agent created.');
      router.push(`/dashboard/agents/${isEdit ? agent?.id : data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
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
              defaultValue={agent?.name ?? ''}
              className={inputClass}
              placeholder='Screener v3'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label htmlFor='aiSystemId' className='text-sm font-medium'>
                AI system
              </label>
              <select
                id='aiSystemId'
                name='aiSystemId'
                className={inputClass}
                defaultValue={agent?.aiSystemId ?? systems[0]?.id ?? ''}
              >
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>
              <p className='text-muted-foreground text-xs'>
                The system this agent runs inside. It sets what regulations apply.
              </p>
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='type' className='text-sm font-medium'>
                Type
              </label>
              <select
                id='type'
                name='type'
                className={`${inputClass} capitalize`}
                defaultValue={agent?.type ?? 'assistant'}
              >
                {agentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label htmlFor='modelProvider' className='text-sm font-medium'>
                Model provider
              </label>
              <input
                id='modelProvider'
                name='modelProvider'
                defaultValue={agent?.modelProvider ?? ''}
                className={inputClass}
                placeholder='openai, anthropic, google'
              />
            </div>
            <div className='space-y-1.5'>
              <label htmlFor='modelName' className='text-sm font-medium'>
                Model name
              </label>
              <input
                id='modelName'
                name='modelName'
                defaultValue={agent?.modelName ?? ''}
                className={inputClass}
                placeholder='gpt-4o, claude-3-5-sonnet'
              />
            </div>
          </div>

          {isEdit && (
            <div className='space-y-1.5'>
              <label htmlFor='status' className='text-sm font-medium'>
                Status
              </label>
              <select
                id='status'
                name='status'
                className={`${inputClass} capitalize`}
                defaultValue={agent?.status ?? 'active'}
              >
                {agentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='space-y-1.5'>
            <label htmlFor='description' className='text-sm font-medium'>
              Description
            </label>
            <input
              id='description'
              name='description'
              defaultValue={agent?.description ?? ''}
              className={inputClass}
              placeholder='Scores each resume against the job description.'
            />
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='systemPrompt' className='text-sm font-medium'>
              System prompt
            </label>
            <textarea
              id='systemPrompt'
              name='systemPrompt'
              rows={3}
              defaultValue={agent?.systemPrompt ?? ''}
              className={inputClass.replace('h-9', 'min-h-20 py-2')}
              placeholder='You score how well a resume matches a role from 0 to 100 and explain why.'
            />
            <p className='text-muted-foreground text-xs'>
              Evaluations read this to judge how well the agent handles each risk.
            </p>
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='externalId' className='text-sm font-medium'>
              External ID
            </label>
            <input
              id='externalId'
              name='externalId'
              defaultValue={agent?.externalId ?? ''}
              className={inputClass}
              placeholder='screener-v3'
            />
            <p className='text-muted-foreground text-xs'>
              Your own identifier for this agent, used to match events sent by the SDK.
            </p>
          </div>

          <div className='flex gap-2'>
            <Button type='submit' isLoading={pending}>
              {isEdit ? 'Save changes' : 'Create agent'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
