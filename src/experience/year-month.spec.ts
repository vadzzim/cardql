import { describe, expect, it } from 'vitest';
import { formatYearMonth, parseYearMonth } from './year-month.js';

describe('parseYearMonth', () => {
  it('returns the first day of the month in UTC', () => {
    expect(parseYearMonth('2021-03')).toEqual(new Date('2021-03-01T00:00:00Z'));
  });

  it.each(['2021-3', '2021-00', '2021-13', '2021-03-01', '21-03', ''])(
    'rejects "%s"',
    (value) => {
      expect(() => parseYearMonth(value)).toThrow(RangeError);
    },
  );
});

describe('formatYearMonth', () => {
  it('formats a UTC date as YYYY-MM', () => {
    expect(formatYearMonth(new Date('2021-03-01T00:00:00Z'))).toBe('2021-03');
  });

  it('round-trips with parseYearMonth', () => {
    expect(formatYearMonth(parseYearMonth('1999-12'))).toBe('1999-12');
  });
});
