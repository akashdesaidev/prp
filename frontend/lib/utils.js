import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object to YYYY-MM-DD string using local timezone
 * Avoids timezone conversion issues that occur with toISOString()
 */
export function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Round number to 2 decimal places and fix floating point precision issues
 */
export function roundToDecimal(number, decimals = 2) {
  return Math.round((number + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format hours display with proper rounding
 */
export function formatHours(hours, decimals = 1) {
  if (!hours || hours === 0) return '0';
  return roundToDecimal(hours, decimals).toFixed(decimals);
}
