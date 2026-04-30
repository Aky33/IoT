import { describe, it, expect } from 'vitest';

function normalizePageInfo({ page = 1, pageSize = 50 } = {}) {
  const rawPage = Number(page);
  const rawSize = Number(pageSize);
  const p = Math.max(1, Number.isFinite(rawPage) ? rawPage : 1);
  const s = Math.min(200, Math.max(1, Number.isFinite(rawSize) ? rawSize : 50));
  return { page: p, pageSize: s, skip: (p - 1) * s };
}

describe('pagination normalizePageInfo', () => {
  it('uses defaults when no args', () => {
    const result = normalizePageInfo();
    expect(result).toEqual({ page: 1, pageSize: 50, skip: 0 });
  });

  it('clamps page to minimum 1', () => {
    expect(normalizePageInfo({ page: 0 }).page).toBe(1);
    expect(normalizePageInfo({ page: -5 }).page).toBe(1);
  });

  it('clamps pageSize to maximum 200', () => {
    expect(normalizePageInfo({ pageSize: 500 }).pageSize).toBe(200);
    expect(normalizePageInfo({ pageSize: 201 }).pageSize).toBe(200);
  });

  it('clamps pageSize to minimum 1', () => {
    expect(normalizePageInfo({ pageSize: 0 }).pageSize).toBe(1);
    expect(normalizePageInfo({ pageSize: -10 }).pageSize).toBe(1);
  });

  it('handles string inputs', () => {
    const result = normalizePageInfo({ page: '3', pageSize: '25' });
    expect(result).toEqual({ page: 3, pageSize: 25, skip: 50 });
  });

  it('handles non-numeric inputs gracefully', () => {
    const result = normalizePageInfo({ page: 'abc', pageSize: 'xyz' });
    expect(result).toEqual({ page: 1, pageSize: 50, skip: 0 });
  });

  it('calculates skip correctly', () => {
    expect(normalizePageInfo({ page: 3, pageSize: 10 }).skip).toBe(20);
    expect(normalizePageInfo({ page: 1, pageSize: 50 }).skip).toBe(0);
  });
});
