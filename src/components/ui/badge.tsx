import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-terracotta text-white hover:bg-terracotta-dark",
        secondary:
          "border-transparent bg-jade text-white hover:bg-jade-dark",
        outline:
          "text-foreground border-border",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-emerald-100 text-emerald-800",
        warning:
          "border-transparent bg-amber-100 text-amber-800",
        /* Category-specific badge styles */
        "pueblo-magico":
          "border-transparent bg-terracotta/10 text-terracotta",
        museo:
          "border-transparent bg-jade/10 text-jade",
        "zona-arqueologica":
          "border-transparent bg-oro/10 text-oro",
        naturaleza:
          "border-transparent bg-emerald-100 text-emerald-700",
        gastronomia:
          "border-transparent bg-rose-100 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
