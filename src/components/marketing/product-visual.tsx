import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

/** A window chrome frame that wraps a product mock. */
export function BrowserFrame({
  children,
  url = 'veydria.devpilotx.com/dashboard/audit',
  className
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-card overflow-hidden rounded-xl border shadow-2xl',
        className
      )}
    >
      <div className='border-border bg-muted/60 flex items-center gap-2 border-b px-4 py-3'>
        <span className='size-3 rounded-full bg-red-400/70' />
        <span className='size-3 rounded-full bg-amber-400/70' />
        <span className='size-3 rounded-full bg-emerald-400/70' />
        <div className='flex flex-1 justify-center'>
          <div className='bg-background/70 text-muted-foreground rounded-md px-3 py-1 text-xs'>
            {url}
          </div>
        </div>
      </div>
      <div className='bg-background'>{children}</div>
    </div>
  );
}

const tone = {
  red: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  blue: 'border-primary/30 bg-primary/10 text-primary dark:border-blue-400/40 dark:bg-blue-400/15 dark:text-blue-200',
  gray: 'border-border bg-muted text-muted-foreground'
} as const;

function Pill({
  children,
  color = 'gray'
}: {
  children: React.ReactNode;
  color?: keyof typeof tone;
}) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', tone[color])}>
      {children}
    </span>
  );
}

function Bar({ w }: { w: string }) {
  return <div className='bg-muted h-2 rounded-full' style={{ width: w }} />;
}

/** The hero mock: the audit log screen with a slim sidebar, the way the app looks. */
export function AuditScreenMock() {
  const nav = ['Dashboard', 'AI Systems', 'Agents', 'Evaluations', 'Audit log'];
  const rows = [
    { seq: 9, action: 'alert.raised', actor: 'Monitoring', time: '6h ago' },
    { seq: 8, action: 'document.generated', actor: 'Dana Okafor', time: '20h ago' },
    { seq: 7, action: 'evaluation.completed', actor: 'Sam Rivera', time: '1d ago' },
    { seq: 6, action: 'agent.connected', actor: 'Production SDK', time: '8d ago' },
    { seq: 5, action: 'ai_system.classified', actor: 'Rules engine', time: '9d ago' }
  ];
  return (
    <div className='flex h-[420px] text-left'>
      <aside className='border-border hidden w-48 shrink-0 flex-col border-r p-3 sm:flex'>
        <div className='flex items-center gap-2 px-1 pb-4 font-semibold'>
          <LogoMark className='size-5' />
          <span className='text-sm'>Veydria</span>
        </div>
        {nav.map((item) => (
          <div
            key={item}
            className={cn(
              'rounded-md px-2 py-1.5 text-xs',
              item === 'Audit log'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item}
          </div>
        ))}
      </aside>
      <div className='flex-1 space-y-4 overflow-hidden p-5'>
        <div>
          <div className='text-sm font-semibold'>Audit log</div>
          <div className='text-muted-foreground text-xs'>
            Append only and hash chained, verifiable on demand.
          </div>
        </div>
        <div className='border-border flex items-center gap-3 rounded-lg border p-3'>
          <span className='flex size-8 items-center justify-center rounded-full bg-emerald-500/10'>
            <svg
              viewBox='0 0 24 24'
              className='size-4 text-emerald-600 dark:text-emerald-400'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M5 12l4 4L19 7' />
            </svg>
          </span>
          <div>
            <div className='text-xs font-medium'>The chain is intact</div>
            <div className='text-muted-foreground text-[11px]'>
              All 9 entries verified. No record altered.
            </div>
          </div>
        </div>
        <div className='border-border overflow-hidden rounded-lg border'>
          <div className='text-muted-foreground bg-muted/50 grid grid-cols-[28px_1fr_84px] gap-2 px-3 py-2 text-[10px] font-medium'>
            <span>Seq</span>
            <span>Action</span>
            <span>When</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.seq}
              className='border-border/60 grid grid-cols-[28px_1fr_84px] items-center gap-2 border-t px-3 py-2 text-[11px]'
            >
              <span className='text-muted-foreground'>{r.seq}</span>
              <span className='flex items-center gap-2'>
                <Pill color='blue'>{r.action}</Pill>
                <span className='text-muted-foreground hidden md:inline'>{r.actor}</span>
              </span>
              <span className='text-muted-foreground'>{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DiscoverMock() {
  const systems = [
    { name: 'Resume Screening Assistant', tier: 'High risk', color: 'red' as const },
    { name: 'Customer Support Copilot', tier: 'Limited', color: 'amber' as const },
    { name: 'Internal Docs Summarizer', tier: 'Minimal', color: 'green' as const },
    { name: 'Credit Pre-Qualification Model', tier: 'High risk', color: 'red' as const }
  ];
  return (
    <div className='space-y-2 p-4'>
      {systems.map((s) => (
        <div
          key={s.name}
          className='border-border flex items-center justify-between rounded-lg border px-3 py-2.5'
        >
          <div className='flex items-center gap-2'>
            <span className='bg-primary/10 flex size-6 items-center justify-center rounded-md'>
              <span className='bg-primary size-2 rounded-full' />
            </span>
            <span className='text-xs font-medium'>{s.name}</span>
          </div>
          <Pill color={s.color}>{s.tier}</Pill>
        </div>
      ))}
    </div>
  );
}

export function ClassifyMock() {
  const obligations = [
    { ref: 'Article 9', label: 'Risk management system', done: true },
    { ref: 'Article 10', label: 'Data and data governance', done: true },
    { ref: 'Article 14', label: 'Human oversight', done: false },
    { ref: 'Article 15', label: 'Accuracy and robustness', done: false }
  ];
  return (
    <div className='space-y-3 p-4'>
      <div className='flex items-center gap-2'>
        <Pill color='red'>High risk</Pill>
        <span className='text-muted-foreground text-[11px]'>Annex III, employment</span>
      </div>
      <div className='space-y-1.5'>
        {obligations.map((o) => (
          <div
            key={o.ref}
            className='border-border flex items-center gap-2 rounded-md border px-3 py-2'
          >
            <span
              className={cn(
                'flex size-4 items-center justify-center rounded-full text-[9px]',
                o.done
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {o.done ? '✓' : ''}
            </span>
            <span className='text-muted-foreground text-[11px]'>{o.ref}</span>
            <span className='text-xs'>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvaluateMock() {
  const evals = [
    { type: 'Hallucination', score: 88, pass: true },
    { type: 'Prompt injection', score: 71, pass: true },
    { type: 'Bias', score: 64, pass: false }
  ];
  return (
    <div className='space-y-3 p-4'>
      {evals.map((e) => (
        <div key={e.type} className='border-border rounded-lg border p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-xs font-medium'>{e.type}</span>
            <span className='flex items-center gap-2'>
              <span className='text-sm font-semibold'>{e.score}</span>
              <Pill color={e.pass ? 'green' : 'red'}>{e.pass ? 'passed' : 'failed'}</Pill>
            </span>
          </div>
          <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
            <div
              className={cn('h-full rounded-full', e.pass ? 'bg-emerald-500' : 'bg-red-500')}
              style={{ width: `${e.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonitorMock() {
  const points = [30, 42, 38, 55, 48, 62, 58, 70, 66, 78];
  return (
    <div className='space-y-3 p-4'>
      <div className='border-border rounded-lg border p-3'>
        <div className='text-muted-foreground mb-2 text-[11px]'>Agent activity, last 7 days</div>
        <div className='flex h-20 items-end gap-1'>
          {points.map((p, i) => (
            <div key={i} className='bg-primary/70 flex-1 rounded-t' style={{ height: `${p}%` }} />
          ))}
        </div>
      </div>
      <div className='flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2'>
        <span className='size-2 rounded-full bg-red-500' />
        <span className='text-[11px] text-red-600 dark:text-red-400'>
          Flagged: possible personal data in agent output
        </span>
      </div>
    </div>
  );
}

export function ProveMock() {
  return (
    <div className='space-y-3 p-4'>
      <div className='border-border rounded-lg border p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-xs font-semibold'>Risk assessment</span>
          <Pill color='blue'>v2</Pill>
        </div>
        <div className='space-y-1.5'>
          <Bar w='90%' />
          <Bar w='75%' />
          <Bar w='82%' />
          <Bar w='60%' />
        </div>
      </div>
      <div className='flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2'>
        <span className='text-emerald-600 dark:text-emerald-400'>
          <svg
            viewBox='0 0 24 24'
            className='size-4'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M5 12l4 4L19 7' />
          </svg>
        </span>
        <span className='text-[11px] text-emerald-600 dark:text-emerald-400'>
          Evidence ready, audit trail verified
        </span>
      </div>
    </div>
  );
}
