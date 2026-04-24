"use client";

import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-[var(--action)] text-white hover:bg-[var(--action-hover)]",
        secondary:
          "border border-[var(--line-strong)] bg-[var(--surface-raised)] text-[var(--ink)] hover:border-[var(--action)] hover:text-[var(--action)]",
        ghost: "text-[var(--muted)] hover:text-[var(--ink)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
