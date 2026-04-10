import { describe, expect, it } from 'vitest';

import { cn } from '../lib/utils';

describe('cn', () => {
  it('joins class names from multiple inputs', () => {
    expect(cn('flex', undefined, 'items-center')).toBe('flex items-center');
  });

  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'text-sm', 'px-4')).toBe('text-sm px-4');
  });
});
