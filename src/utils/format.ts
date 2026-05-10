// ==================== Formatting Utilities ====================

/**
 * Format a date string to Arabic locale
 * @param dateStr - ISO date string or date string
 * @param options - Intl.DateTimeFormat options override
 */
export function formatDate(
  dateStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string (HH:mm or ISO) to Arabic locale
 */
export function formatTime(
  timeStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!timeStr) return '—';
  try {
    // If it's just HH:mm format
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      });
    }
    // Full ISO string
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  } catch {
    return timeStr;
  }
}

/**
 * Format currency in Iraqi Dinars
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('ar-IQ') + ' د.ع';
}

/**
 * Format a number with Arabic locale
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '—';
  return num.toLocaleString('ar-IQ');
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return value.toFixed(decimals) + '%';
}
