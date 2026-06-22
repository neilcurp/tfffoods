import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Empty number inputs when value is 0 so forms don't show a stuck "0". */
export function numberInputDisplay(value: number | undefined | null): string | number {
  if (value === undefined || value === null || value === 0) return "";
  return value;
}

export function parseNumberInput(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
