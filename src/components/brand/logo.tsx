import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

/**
 * The Veydria mark: a split V for controlled intelligence with an amber node
 * for the evidence attached to every decision. The left stroke uses
 * currentColor so it reads navy on light surfaces and white on dark ones, the
 * right stroke follows the primary color, and the node stays Evidence Amber.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 64 64'
      className={cn('size-7', className)}
      role='img'
      aria-label={`${brand.name} mark`}
    >
      <path fill='currentColor' d='M7 8h13.25L32 36.4 25.12 54 7 8Z' />
      <path fill='var(--primary)' d='M43.75 8H57L38.88 54 32 36.4 43.75 8Z' />
      <rect
        x='27.1'
        y='31.5'
        width='9.8'
        height='9.8'
        rx='2.2'
        transform='rotate(45 32 36.4)'
        fill='#F4A62A'
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('text-foreground inline-flex items-center gap-2 font-semibold', className)}>
      <LogoMark className='size-7' />
      <span className='text-lg tracking-tight'>{brand.name}</span>
    </span>
  );
}
