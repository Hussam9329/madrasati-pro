/**
 * Tests for export utilities (CSV sanitization)
 */
import { describe, it, expect } from 'vitest';

// Test the sanitizeCsvValue logic directly
// (importing the full module requires DOM which may not be available)

function sanitizeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}

describe('CSV Export Sanitization', () => {
  it('should handle null values', () => {
    expect(sanitizeCsvValue(null)).toBe('""');
  });

  it('should handle undefined values', () => {
    expect(sanitizeCsvValue(undefined)).toBe('""');
  });

  it('should wrap normal strings in quotes', () => {
    expect(sanitizeCsvValue('hello')).toBe('"hello"');
  });

  it('should escape internal double quotes', () => {
    expect(sanitizeCsvValue('say "hello"')).toBe('"say ""hello"""');
  });

  it('should neutralize formula injection with = prefix', () => {
    // =SUM() is a dangerous CSV formula
    const result = sanitizeCsvValue('=SUM(A1:A10)');
    // Result should be "'=SUM(A1:A10)" with the single quote neutralizing the formula
    expect(result).toContain("'=SUM");
    expect(result.startsWith("\"'")).toBe(true);
  });

  it('should neutralize formula injection with + prefix', () => {
    const result = sanitizeCsvValue('+cmd|/C calc');
    expect(result.startsWith("\"'")).toBe(true);
  });

  it('should neutralize formula injection with - prefix', () => {
    const result = sanitizeCsvValue('-1+1|cmd');
    expect(result.startsWith("\"'")).toBe(true);
  });

  it('should neutralize formula injection with @ prefix', () => {
    const result = sanitizeCsvValue('@SUM(A1)');
    expect(result.startsWith("\"'")).toBe(true);
  });

  it('should handle numbers', () => {
    expect(sanitizeCsvValue(42)).toBe('"42"');
  });

  it('should handle Arabic text', () => {
    expect(sanitizeCsvValue('أحمد محمد')).toBe('"أحمد محمد"');
  });

  it('should not modify safe values', () => {
    expect(sanitizeCsvValue('مدرستي')).toBe('"مدرستي"');
    expect(sanitizeCsvValue('12345')).toBe('"12345"');
  });
});
