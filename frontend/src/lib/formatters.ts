/**
 * Deterministic date and time formatting utilities.
 * Pure string parsing avoids SSR hydration mismatches and timezone offset skew.
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Formats YYYY-MM-DD into "Aug 3, 2026"
 */
export function formatSignalDate(dateStr?: string | null, fullMonth = false): string {
  if (!dateStr) return "N/A";
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;
  const monthIdx = parseInt(month, 10) - 1;
  const monthList = fullMonth ? FULL_MONTH_NAMES : MONTH_NAMES;
  const monthName = monthList[monthIdx] || month;
  const dayNum = parseInt(day, 10);

  return `${monthName} ${dayNum}, ${year}`;
}

/**
 * Formats 24h "HH:MM" into "9:00 AM" or "4:15 PM"
 */
export function formatSignalTime(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${h12}:${minutes} ${ampm}`;
}

/**
 * Formats date and time into "Aug 3, 2026 · 9:00 AM"
 */
export function formatSignalDateTime(dateStr?: string | null, timeStr?: string | null): string {
  const d = formatSignalDate(dateStr);
  if (!timeStr) return d;
  const t = formatSignalTime(timeStr);
  return `${d} · ${t}`;
}
