import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20',
        secondary:
          'bg-gray-100 text-gray-600 border border-gray-200',
        destructive:
          'bg-red-50 text-red-600 border border-red-200',
        warning:
          'bg-amber-50 text-amber-600 border border-amber-200',
        success:
          'bg-emerald-50 text-emerald-600 border border-emerald-200',
        outline:
          'text-gray-600 border border-gray-300',
        gold:
          'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20',
        green:
          'bg-emerald-50 text-emerald-600 border border-emerald-200',
        blue:
          'bg-sky-50 text-sky-600 border border-sky-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
