import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tone = {
  red: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  gray: 'border-border bg-muted text-muted-foreground'
} as const;

type Tone = keyof typeof tone;

function Pill({ label, color }: { label: string; color: Tone }) {
  return (
    <Badge variant='outline' className={cn('font-medium capitalize', tone[color])}>
      {label}
    </Badge>
  );
}

const riskTone: Record<string, Tone> = {
  prohibited: 'red',
  high: 'red',
  limited: 'amber',
  minimal: 'green',
  unknown: 'gray'
};

export function RiskBadge({ tier }: { tier: string }) {
  return (
    <Pill
      label={tier === 'unknown' ? 'Unclassified' : `${tier} risk`}
      color={riskTone[tier] ?? 'gray'}
    />
  );
}

const obligationTone: Record<string, Tone> = {
  met: 'green',
  in_progress: 'amber',
  not_started: 'gray',
  not_applicable: 'blue'
};

export function ObligationStatusBadge({ status }: { status: string }) {
  return <Pill label={status.replace(/_/g, ' ')} color={obligationTone[status] ?? 'gray'} />;
}

const severityTone: Record<string, Tone> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'blue',
  info: 'gray'
};

export function SeverityBadge({ severity }: { severity: string }) {
  return <Pill label={severity} color={severityTone[severity] ?? 'gray'} />;
}

const evalTone: Record<string, Tone> = {
  passed: 'green',
  failed: 'red',
  running: 'blue',
  queued: 'gray',
  error: 'red'
};

export function EvaluationStatusBadge({ status }: { status: string }) {
  return <Pill label={status} color={evalTone[status] ?? 'gray'} />;
}

const alertTone: Record<string, Tone> = {
  open: 'red',
  acknowledged: 'amber',
  resolved: 'green'
};

export function AlertStatusBadge({ status }: { status: string }) {
  return <Pill label={status} color={alertTone[status] ?? 'gray'} />;
}
