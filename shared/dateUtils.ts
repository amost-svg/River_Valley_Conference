import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Conference timezone
export const CONFERENCE_TIMEZONE = 'America/Chicago';

/**
 * Parse a date string in the conference timezone
 * This prevents off-by-one errors from UTC conversion
 */
export function parseConferenceDate(dateString: string): Date {
  // If it's just a date (YYYY-MM-DD), treat it as noon in Chicago time
  // to avoid timezone boundary issues
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  
  if (dateOnly) {
    // Add noon time to avoid midnight boundary issues
    const dateTimeString = `${dateString}T12:00:00`;
    return toZonedTime(dateTimeString, CONFERENCE_TIMEZONE);
  }
  
  // For full timestamps, convert to conference timezone
  return toZonedTime(dateString, CONFERENCE_TIMEZONE);
}

/**
 * Format a date in the conference timezone
 */
export function formatConferenceDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseConferenceDate(date) : date;
  return formatInTimeZone(dateObj, CONFERENCE_TIMEZONE, formatString);
}

/**
 * Get day of week for a date in conference timezone
 */
export function getConferenceDayOfWeek(date: Date | string): string {
  return formatConferenceDate(date, 'EEEE');
}

/**
 * Check if two dates are the same day in conference timezone
 */
export function isSameConferenceDay(date1: Date | string, date2: Date | string): boolean {
  // Parse dates properly in conference timezone before comparing
  const parsed1 = typeof date1 === 'string' ? parseConferenceDate(date1) : date1;
  const parsed2 = typeof date2 === 'string' ? parseConferenceDate(date2) : date2;
  
  const day1 = formatConferenceDate(parsed1, 'yyyy-MM-dd');
  const day2 = formatConferenceDate(parsed2, 'yyyy-MM-dd');
  return day1 === day2;
}

/**
 * Create a date at noon in conference timezone (avoids midnight boundary issues)
 */
export function createConferenceDate(year: number, month: number, day: number): Date {
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
  return toZonedTime(dateString, CONFERENCE_TIMEZONE);
}

/**
 * Format date for API queries (YYYY-MM-DD in local timezone)
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date | string): string {
  return formatConferenceDate(date, 'MMM dd, yyyy');
}

/**
 * Format date with day of week
 */
export function formatDateWithDayOfWeek(date: Date | string): string {
  return formatConferenceDate(date, 'EEEE, MMM dd, yyyy');
}
