import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: keyof typeof Icons;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

const toneClass = {
  default: 'text-muted-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  success: 'text-emerald-600 dark:text-emerald-400'
} as const;

export function StatCard({ title, value, hint, icon, tone = 'default' }: StatCardProps) {
  const Icon = icon ? Icons[icon] : null;
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
        {Icon && <Icon className={cn('h-4 w-4', toneClass[tone])} />}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-semibold'>{value}</div>
        {hint && <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>}
      </CardContent>
    </Card>
  );
}
