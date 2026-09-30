// Work periods have month precision. The database stores a DATE set to the
// first day of the month; the API and the seed data use "YYYY-MM".

export const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseYearMonth(value: string): Date {
  if (!YEAR_MONTH_PATTERN.test(value)) {
    throw new RangeError(`Expected "YYYY-MM", got "${value}"`);
  }

  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

// DATE columns come back as UTC midnight, so the UTC year and month are the
// stored ones regardless of the server time zone.
export function formatYearMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
