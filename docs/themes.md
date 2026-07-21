# Theming

Veydria ships one brand theme with a light and a dark variant. There is no theme picker. People switch between light and dark with the toggle in the dashboard header, or through the command palette (press the shortcut, then choose a mode). The choice is remembered by next-themes.

## Where the colors live

All tokens are defined in `src/styles/theme.css`:

- `:root` holds the light variant.
- `.dark` holds the dark variant. next-themes adds the `.dark` class to the `html` element when dark mode is active.
- The `@theme inline` block maps each token to a Tailwind color, so utilities like `bg-background`, `text-foreground`, and `border-border` resolve to the tokens.

Colors are written in oklch. The palette is a cool neutral base around a trustworthy indigo primary, with a coordinated five color chart scale.

## Changing the brand color

Edit the `--primary`, `--ring`, and the `--sidebar-primary` tokens in both `:root` and `.dark`. Keep enough contrast against `--primary-foreground` for text on buttons. The chart tokens (`--chart-1` through `--chart-5`) drive the graphs and can be tuned to match.

## Fonts

Fonts are loaded in `src/components/themes/font.config.ts` with `next/font`. The theme uses Geist for sans and Geist Mono for mono. The variables are applied to the `body` element in the root layout.

## Dark and light toggle

- `src/components/themes/theme-mode-toggle.tsx` is the header toggle.
- `src/components/themes/theme-provider.tsx` wraps next-themes.
- `src/components/kbar/use-theme-switching.tsx` registers the light, dark, and system actions in the command palette.
