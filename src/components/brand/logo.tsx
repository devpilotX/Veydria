import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

/**
 * The AgentProof mark: a shield for governance with a check for proof. Drawn as
 * line art in currentColor so it matches the app's icon set and adapts to light
 * and dark themes. Use `LogoMark` for the glyph alone, `Logo` for the full
 * lockup with the product name.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('size-6', className)}
      aria-hidden='true'
    >
      <path d='M12 3 L18.5 5.4 L18.5 11 C18.5 15.2 15.6 18.5 12 19.8 C8.4 18.5 5.5 15.2 5.5 11 L5.5 5.4 Z' />
      <path d='M9 11.6 L11.2 13.8 L15 9.4' />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <span
        className={cn(
          'bg-foreground text-background flex size-7 items-center justify-center rounded-md',
          markClassName
        )}
      >
        <LogoMark className='size-4' />
      </span>
      <span className='tracking-tight'>{brand.name}</span>
    </span>
  );
}
