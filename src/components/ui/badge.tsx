import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "bg-neutral-900 text-white",
  secondary:
    "bg-neutral-100 text-neutral-900",
  destructive:
    "bg-red-100 text-red-700",
  success:
    "bg-emerald-100 text-emerald-700",
  warning:
    "bg-amber-100 text-amber-700",
  outline:
    "border border-neutral-300 text-neutral-700",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  children?: ReactNode;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
