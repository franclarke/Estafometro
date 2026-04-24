import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
