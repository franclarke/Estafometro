import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type LogoVariant = "isotype" | "lockup";

type LogoProps = {
  variant?: LogoVariant;
  title?: string;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
};

export function Logo({
  variant = "lockup",
  title = "Estafómetro",
  className,
  iconClassName,
  wordmarkClassName,
}: LogoProps) {
  if (variant === "isotype") {
    return (
      <LogoIsotype
        aria-label={title}
        role="img"
        className={cn("h-7 w-7", className, iconClassName)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoIsotype
        aria-hidden="true"
        className={cn("h-7 w-7", iconClassName)}
      />
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-[var(--brand-ink)]",
          wordmarkClassName,
        )}
      >
        Estafómetro
      </span>
    </span>
  );
}

type IsotypeProps = SVGProps<SVGSVGElement> & {
  animate?: "idle" | "scanning";
};

export function LogoIsotype({ animate = "idle", className, ...props }: IsotypeProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* speech bubble silhouette */}
      <path
        d="M32 6c13.807 0 25 9.551 25 21.333 0 11.783-11.193 21.334-25 21.334-2.686 0-5.277-.362-7.703-1.03L11.2 55.2a1 1 0 0 1-1.542-1.046l2.2-9.66C8.678 40.71 7 34.342 7 27.333 7 15.55 18.193 6 32 6Z"
        stroke="var(--brand)"
        strokeWidth="3.2"
        strokeLinejoin="round"
        fill="var(--surface-raised)"
      />
      {/* gauge arc */}
      <path
        d="M18 32a14 14 0 0 1 28 0"
        stroke="var(--brand)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* gauge needle */}
      <g
        style={{
          transformOrigin: "32px 32px",
          transformBox: "view-box",
          animation:
            animate === "scanning"
              ? "needle-sweep 1.8s ease-in-out infinite"
              : undefined,
        }}
      >
        <line
          x1="32"
          y1="32"
          x2="41"
          y2="22"
          stroke="var(--brand-ink)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </g>
      {/* pivot */}
      <circle cx="32" cy="32" r="2" fill="var(--brand-ink)" />
      {/* risk dots */}
      <circle cx="23" cy="41" r="2.2" fill="var(--risk-low)" />
      <circle cx="32" cy="41" r="2.2" fill="var(--risk-medium)" />
      <circle cx="41" cy="41" r="2.2" fill="var(--risk-very-high)" />
    </svg>
  );
}
