import React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// --- InvestorIQ Label Styles ---
const labelVariants = cva(
  'text-sm font-medium leading-none text-iqnavy peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors',
  {
    variants: {
      required: {
        true: 'after:ml-1 after:text-iqgold after:content-["*"]',
      },
    },
    defaultVariants: {
      required: false,
    },
  }
);

const Label = React.forwardRef(({ className, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ required }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
