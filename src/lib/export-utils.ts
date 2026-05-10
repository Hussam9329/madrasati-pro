/**
 * CSV export utility with injection-safe sanitization.
 * Prevents CSV formula injection by escaping dangerous characters.
 */
export function exportToCSV(data: Record<string, string | number | null | undefined>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);

  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => sanitizeCsvValue(row[h])).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

/**
 * Sanitize a CSV value to prevent formula injection and format properly.
 * - Wraps values in double quotes
 * - Escapes internal double quotes
 * - Prefixes dangerous characters (=, +, -, @, tab, CR) with a single quote
 *   to prevent Excel/Sheets from interpreting them as formulas
 */
function sanitizeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';

  const str = String(value);

  // Escape internal double quotes
  const escaped = str.replace(/"/g, '""');

  // Check for formula injection patterns (starts with =, +, -, @, or contains tab/CR)
  if (/^[=+\-@\t\r]/.test(str)) {
    // Prefix with single quote to neutralize formula
    return `"'${escaped}"`;
  }

  return `"${escaped}"`;
}
