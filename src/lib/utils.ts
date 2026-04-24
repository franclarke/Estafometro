import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function toTitleCase(input: string) {
  return input
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function isNonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

export function compact<T>(items: Array<T | null | undefined | false>): T[] {
  return items.filter(Boolean) as T[];
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function hashLike(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return String(Math.abs(hash));
}
