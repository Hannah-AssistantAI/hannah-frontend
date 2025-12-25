/**
 * Date utilities for Vietnam timezone (UTC+7)
 * Backend stores dates in UTC, frontend converts for display
 */

// Vietnam timezone
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Parse a date string as UTC
 * Backend returns datetime WITHOUT 'Z' suffix but it's actually UTC
 * This ensures proper timezone conversion
 * 
 * @param dateString - Date string from API (may or may not have Z suffix)
 * @returns Date object parsed as UTC
 */
export function parseAsUTC(dateString: string | Date): Date {
  if (dateString instanceof Date) return dateString;
  
  // If the string already has timezone info (Z, +, -), parse directly
  if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Backend returns UTC time without Z suffix - add it
  // Example: "2025-12-24T15:44:00" should be parsed as "2025-12-24T15:44:00Z"
  return new Date(dateString + 'Z');
}

/**
 * Format a date string to Vietnam timezone
 * @param dateString - ISO date string from API (UTC)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Vietnam timezone
 */
export function formatDateVN(
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('vi-VN', {
      ...options,
      timeZone: VIETNAM_TIMEZONE,
    });
  } catch {
    return '-';
  }
}

/**
 * Format a datetime string to Vietnam timezone with time
 * @param dateString - ISO date string from API (UTC)
 * @returns Formatted datetime string (e.g., "24/12/2024, 22:30")
 */
export function formatDateTimeVN(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format a datetime string to Vietnam timezone with full time (including seconds)
 * @param dateString - ISO date string from API (UTC)
 * @returns Formatted datetime string (e.g., "24/12/2024, 22:30:45")
 */
export function formatDateTimeFullVN(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format time only in Vietnam timezone
 * @param dateString - ISO date string from API (UTC)
 * @returns Formatted time string (e.g., "22:30")
 */
export function formatTimeVN(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleTimeString('vi-VN', {
      timeZone: VIETNAM_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Get relative time string (e.g., "5 phút trước", "2 giờ trước", "Hôm qua")
 * @param dateString - ISO date string from API (UTC)
 * @returns Relative time string in Vietnamese
 */
export function formatRelativeTimeVN(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'Vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} tuần trước`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} tháng trước`;
    } else {
      return formatDateVN(date);
    }
  } catch {
    return '-';
  }
}

/**
 * Format date for display with relative time if recent, else full date
 * @param dateString - ISO date string from API (UTC)
 * @param recentThresholdHours - Hours threshold for showing relative time (default: 24)
 * @returns Relative time if recent, otherwise formatted date
 */
export function formatSmartDateVN(
  dateString: string | Date | null | undefined,
  recentThresholdHours: number = 24
): string {
  if (!dateString) return '-';
  
  try {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < recentThresholdHours) {
      return formatRelativeTimeVN(date);
    } else {
      return formatDateTimeVN(date);
    }
  } catch {
    return '-';
  }
}

/**
 * Check if a date is today in Vietnam timezone
 */
export function isToday(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseAsUTC(dateString);
    const today = new Date();
    
    const dateVN = date.toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIMEZONE });
    const todayVN = today.toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIMEZONE });
    
    return dateVN === todayVN;
  } catch {
    return false;
  }
}

/**
 * Check if a date is yesterday in Vietnam timezone
 */
export function isYesterday(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseAsUTC(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateVN = date.toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIMEZONE });
    const yesterdayVN = yesterday.toLocaleDateString('vi-VN', { timeZone: VIETNAM_TIMEZONE });
    
    return dateVN === yesterdayVN;
  } catch {
    return false;
  }
}
