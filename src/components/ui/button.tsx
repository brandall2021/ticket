"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-sm dark:bg-navy-700 dark:text-neutral-100 dark:hover:bg-navy-600",
  destructive:
    "bg-red-600 text-white hover:bg-red-500 shadow-sm",
  outline:
    "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-navy-600 dark:bg-navy-800 dark:text-neutral-100 dark:hover:bg-navy-700",
  ghost:
    "text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-navy-700",
} as const;

const sizeStyles = {
  sm: "h-8 rounded-md px-3 text-xs",
  default: "h-10 rounded-lg px-4 text-sm",
  lg: "h-12 rounded-lg px-6 text-base",
  icon: "h-10 w-10 rounded-lg",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
