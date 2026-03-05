import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCestTimestamp(timestamp: number = Date.now()): number {
  // Use en-CA for YYYY-MM-DD format, which is easier to manipulate
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formatted = formatter.formatToParts(new Date(timestamp));
  const get = (type: string) => formatted.find(p => p.type === type)?.value;

  // Reconstruct ISO-like date string but in Berlin's local time, then parse as UTC
  const isoStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`;
  return new Date(isoStr).getTime();
}