import { describe, expect, it } from 'vitest';

import {
  InvalidPermissionCodeError,
  hasAllPermissions,
  hasAnyPermission,
  isPermissionCode,
  normalizePermissionCodes,
} from './permissions.js';

describe('permission primitives', () => {
  it('validates bounded dot-separated permission codes', () => {
    expect(isPermissionCode('orders.view.company')).toBe(true);
    expect(isPermissionCode('orders view')).toBe(false);
    expect(isPermissionCode('Orders.view')).toBe(false);
    expect(isPermissionCode('x'.repeat(101))).toBe(false);
  });

  it('returns immutable, sorted and deduplicated permission sets', () => {
    const normalized = normalizePermissionCodes(['orders.create', 'company.view', 'orders.create']);

    expect(normalized).toEqual(['company.view', 'orders.create']);
    expect(Object.isFrozen(normalized)).toBe(true);
  });

  it('evaluates all/any permission algebra without accepting invalid input', () => {
    const granted = ['company.view', 'orders.create'];

    expect(hasAllPermissions(granted, ['company.view', 'orders.create'])).toBe(true);
    expect(hasAllPermissions(granted, ['orders.view.company'])).toBe(false);
    expect(hasAnyPermission(granted, ['orders.view.company', 'orders.create'])).toBe(true);
    expect(() => normalizePermissionCodes(['orders.*'])).toThrow(InvalidPermissionCodeError);
  });
});
