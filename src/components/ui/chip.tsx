"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipColorMap: Record<string, string> = {
  "pueblo-magico": "bg-terracotta/10 text-terracotta border-terracotta/20 hover:bg-terracotta/20 data-[active=true]:bg-terracotta data-[active=true]:text-white",
  museo: "bg-jade/10 text-jade border-jade/20 hover:bg-jade/20 data-[active=true]:bg-jade data-[active=true]:text-white",
  "zona-arqueologica": "bg-oro/10 text-oro border-oro/20 hover:bg-oro/20 data-[active=true]:bg-oro data-[active=true]:text-white",
  naturaleza: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 data-[active=true]:bg-emerald-600 data-[active=true]:text-white",
  gastronomia: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 data-[active=true]:bg-rose-600 data-[active=true]:text-white",
  cultura: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 data-[active=true]:bg-violet-600 data-[active=true]:text-white",
  aventura: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 data-[active=true]:bg-sky-600 data-[active=true]:text-white",
  default: "bg-muted text-muted-foreground border-border hover:bg-muted/80 data-[active=true]:bg-obsidiana data-[active=true]:text-white",
};

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The display label */
  label: string;
  /** Optional icon element rendered before the label */
  icon?: React.ReactNode;
  /** Whether the chip is in active/selected state */
  active?: boolean;
  /** Category key for color mapping */
  category?: string;
  /** Show a close/remove button */
  removable?: boolean;
  /** Callback when the close button is clicked */
  onRemove?: () => void;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      label,
      icon,
      active = false,
      category = "default",
      removable = false,
      onRemove,
      ...props
    },
    ref
  ) => {
    const colorClasses =
      chipColorMap[category] || chipColorMap.default;

    return (
      <button
        ref={ref}
        type="button"
        data-active={active}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          colorClasses,
          className
        )}
        {...props}
      >
        {icon && <span className="flex shrink-0 [&_svg]:size-3.5">{icon}</span>}
        <span>{label}</span>
        {removable && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Quitar ${label}`}
            className="ml-0.5 flex shrink-0 rounded-full p-0.5 hover:bg-black/10"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onRemove?.();
              }
            }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipColorMap };
