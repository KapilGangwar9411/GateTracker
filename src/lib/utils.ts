import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatString: string = "PPP"): string {
  if (!date) return ""
  
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatString)
}
