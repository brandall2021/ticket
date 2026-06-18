import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-navy-900",
  secondary:
    "bg-neutral-100 text-neutral-900 dark:bg-navy-700 dark:text-neutral-100",
  destructive:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  outline:
    "border border-neutral-300 text-neutral-600 dark:border-navy-600 dark:text-neutral-400",
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
