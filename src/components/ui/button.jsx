import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── InvestorIQ Brand Button Variants ────────────────────────────────────────
// Design system: Forest Green (#0F2318) / Gold (#C9A84C) / Ink (#0C0C0C)
// No rounded corners — institutional posture throughout.
// Hover: Green → Gold inversion. Ghost: hairline border, ink text.
// ─────────────────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base — no rounded-md, DM Mono for labels, gold focus ring
  'inline-flex items-center justify-center text-xs font-medium tracking-[0.14em] uppercase ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary — Forest Green bg / Gold text / Gold hover inversion
        default:
          'border border-[#0F2318] bg-[#0F2318] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0F2318]',

        // Destructive — semantic red, unchanged
        destructive:
          'bg-red-600 text-white hover:bg-red-700 border border-red-700',

        // Outline / Ghost — hairline border, ink text
        outline:
          'border border-[#E8E5DF] text-[#606060] hover:border-[#D0CCC4] hover:text-[#0C0C0C] bg-transparent',

        // Secondary — warm background
        secondary:
          'border border-[#E8E5DF] bg-[#FAFAF8] text-[#363636] hover:border-[#D0CCC4] hover:bg-[#F0EDE8]',

        // Ghost — no border, subtle hover
        ghost:
          'text-[#606060] hover:bg-[#FAFAF8] hover:text-[#0C0C0C] border border-transparent',

        // Link — gold underline
        link:
          'text-[#9A7A2C] underline-offset-4 hover:underline border-none bg-transparent',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm:      'h-9 px-4 py-1.5',
        lg:      'h-11 px-8 py-3',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
