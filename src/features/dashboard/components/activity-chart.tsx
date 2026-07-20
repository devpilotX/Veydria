'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point = { day: string; value: number };

/** A compact area chart of agent activity over the last week. */
export function ActivityChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className='text-muted-foreground flex h-[240px] items-center justify-center text-sm'>
        No activity in the last seven days.
      </div>
    );
  }

  return (
    <ResponsiveContainer width='100%' height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id='activityFill' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--primary)' stopOpacity={0.3} />
            <stop offset='95%' stopColor='var(--primary)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey='day'
          tickFormatter={(value: string) => value.slice(5)}
          stroke='var(--muted-foreground)'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='var(--muted-foreground)'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--popover-foreground)'
          }}
        />
        <Area
          type='monotone'
          dataKey='value'
          stroke='var(--primary)'
          strokeWidth={2}
          fill='url(#activityFill)'
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
