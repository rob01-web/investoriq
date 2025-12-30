import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// --- InvestorIQ Brand Button Variants ---
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iqnavy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-[#0F172A] bg-[#0F172A] text-white hover:bg-[#0d1326]',
        destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-700',
        outline:
          'border border-slate-300 text-[#0F172A] hover:border-slate-400 hover:bg-slate-50',
        secondary:
          'border border-slate-200 bg-slate-100 text-[#0F172A] hover:border-slate-300 hover:bg-slate-200',
        ghost: 'text-iqnavy hover:bg-iqteal/10 hover:text-iqteal',
        link: 'text-iqgold underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
