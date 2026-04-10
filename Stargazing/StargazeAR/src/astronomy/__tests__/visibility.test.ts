/// <reference types="jest" />

import { getVisibilityWarning, type VisibilityWarning } from '../visibility';

describe('getVisibilityWarning', () => {
  it.each([
    { altitudeDeg: -1, expected: 'very_low' as VisibilityWarning },
    { altitudeDeg: 0, expected: 'very_low' as VisibilityWarning },
    { altitudeDeg: 4.9, expected: 'very_low' as VisibilityWarning },
    { altitudeDeg: 5.0, expected: 'low' as VisibilityWarning },
    { altitudeDeg: 14.9, expected: 'low' as VisibilityWarning },
    { altitudeDeg: 15.0, expected: null as VisibilityWarning },
    { altitudeDeg: 45, expected: null as VisibilityWarning },
    { altitudeDeg: 90, expected: null as VisibilityWarning },
    { altitudeDeg: -90, expected: 'very_low' as VisibilityWarning },
    { altitudeDeg: 180, expected: null as VisibilityWarning },
  ])('returns $expected for altitude $altitudeDeg', ({ altitudeDeg, expected }) => {
    expect(getVisibilityWarning(altitudeDeg)).toBe(expected);
  });
});
