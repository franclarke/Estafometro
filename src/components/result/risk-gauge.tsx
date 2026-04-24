"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { riskLabels } from "@/lib/copy/es-ar";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/domain";

type GaugeVariant = "result" | "scanning";

type RiskGaugeProps = {
  score?: number;
  level?: RiskLevel;
  variant?: GaugeVariant;
  label?: string;
  sublabel?: string;
  className?: string;
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  very_high: "var(--risk-very-high)",
};

const TEXT_TONES: Record<RiskLevel, string> = {
  low: "text-[color:var(--risk-low)]",
  medium: "text-[color:var(--risk-medium)]",
  high: "text-[color:var(--risk-high)]",
  very_high: "text-[color:var(--risk-very-high)]",
};

// SVG geometry: 220×130 viewBox, arc radius 90, center (110, 115), half circle above.
// Needle rotates around center. -90° points left (start), +90° points right (end).
const START_ANGLE = -90;
const END_ANGLE = 90;
const ARC_PATH = "M 20 115 A 90 90 0 0 1 200 115";
// Total arc length ≈ π × 90 ≈ 282.74
const ARC_LENGTH = Math.PI * 90;

function scoreToAngle(score: number) {
  const clamped = Math.min(100, Math.max(0, score));
  return START_ANGLE + (clamped / 100) * (END_ANGLE - START_ANGLE);
}

function bandFromScore(score: number): RiskLevel {
  if (score >= 75) return "very_high";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function RiskGauge({
  score = 0,
  level,
  variant = "result",
  label,
  sublabel,
  className,
}: RiskGaugeProps) {
  const resolvedLevel = level ?? bandFromScore(score);
  const color = RISK_COLORS[resolvedLevel];
  const isScanning = variant === "scanning";

  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isScanning) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const duration = prefersReducedMotion ? 0 : 900;
    const startedAt = performance.now();
    const to = score;

    function tick(now: number) {
      const elapsed = now - startedAt;
      if (duration === 0) {
        setAnimatedScore(to);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setAnimatedScore(to * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, isScanning]);

  const displayedScore = Math.round(animatedScore);
  const arcShownLength = (animatedScore / 100) * ARC_LENGTH;
  const needleAngle = isScanning ? 0 : scoreToAngle(animatedScore);

  const fallbackLabel = isScanning
    ? "Revisando señales"
    : riskLabels[resolvedLevel];
  const displayLabel = label ?? fallbackLabel;

  return (
    <div
      className={cn("flex flex-col items-center gap-4", className)}
      role={isScanning ? "status" : "img"}
      aria-live={isScanning ? "polite" : undefined}
      aria-label={
        isScanning
          ? "Revisando señales"
          : `Nivel de riesgo: ${riskLabels[resolvedLevel]}${
              typeof score === "number" ? `, puntaje ${Math.round(score)} de 100` : ""
            }`
      }
    >
      <div className="relative w-full max-w-[320px]">
        <svg
          viewBox="0 0 220 140"
          className="h-auto w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gauge-track-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--risk-low)" stopOpacity="0.22" />
              <stop offset="33%" stopColor="var(--risk-medium)" stopOpacity="0.22" />
              <stop offset="66%" stopColor="var(--risk-high)" stopOpacity="0.24" />
              <stop offset="100%" stopColor="var(--risk-very-high)" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d={ARC_PATH}
            stroke="url(#gauge-track-gradient)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          {/* Outline subtle */}
          <path
            d={ARC_PATH}
            stroke="var(--line)"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          {/* Active arc */}
          {!isScanning ? (
            <path
              d={ARC_PATH}
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
              strokeDashoffset={ARC_LENGTH - arcShownLength}
              style={{ transition: "stroke 200ms linear" }}
            />
          ) : null}
          {/* Tick marks every 25% */}
          {[0, 25, 50, 75, 100].map((t) => {
            const angle = (scoreToAngle(t) * Math.PI) / 180;
            const outerR = 98;
            const innerR = 88;
            const cx = 110;
            const cy = 115;
            const x1 = cx + Math.cos(angle - Math.PI / 2) * outerR;
            const y1 = cy + Math.sin(angle - Math.PI / 2) * outerR;
            const x2 = cx + Math.cos(angle - Math.PI / 2) * innerR;
            const y2 = cy + Math.sin(angle - Math.PI / 2) * innerR;
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--muted-soft)"
                strokeOpacity="0.45"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
          {/* Needle */}
          <g
            style={
              {
                transformOrigin: "110px 115px",
                transformBox: "view-box",
                transform: isScanning ? undefined : `rotate(${needleAngle}deg)`,
                animation: isScanning
                  ? "needle-sweep 1.8s ease-in-out infinite"
                  : undefined,
                transition: isScanning ? undefined : "transform 40ms linear",
              } as CSSProperties
            }
          >
            <line
              x1="110"
              y1="115"
              x2="110"
              y2="38"
              stroke="var(--brand-ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="110" cy="38" r="3.5" fill={isScanning ? "var(--brand)" : color} />
          </g>
          {/* Pivot */}
          <circle cx="110" cy="115" r="9" fill="var(--surface-raised)" stroke="var(--brand-ink)" strokeWidth="2.5" />
          <circle cx="110" cy="115" r="3" fill="var(--brand-ink)" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        {isScanning ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {displayLabel}
          </p>
        ) : (
          <>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]",
              )}
            >
              Nivel de riesgo
            </p>
            <p
              className={cn(
                "text-2xl font-semibold leading-tight sm:text-3xl",
                TEXT_TONES[resolvedLevel],
              )}
            >
              {displayLabel}
            </p>
            {typeof score === "number" ? (
              <p className="text-xs tabular-nums text-[var(--muted)]">
                {displayedScore}/100
              </p>
            ) : null}
          </>
        )}
        {sublabel ? (
          <p className="mt-1 max-w-[34ch] text-sm leading-6 text-[var(--muted)]">
            {sublabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
