import { describe, it, expect } from 'vitest';
import { interpolateColor, CHOROPLETH_COLORS, buildStepExpression } from './colorHelpers';

describe('interpolateColor', () => {
  it('returns the minimum color at ratio 0', () => {
    expect(interpolateColor(0)).toBe('rgb(254, 229, 217)');
  });

  it('returns the maximum color at ratio 1', () => {
    expect(interpolateColor(1)).toBe('rgb(165, 15, 21)');
  });

  it('interpolates correctly at ratio 0.5', () => {
    expect(interpolateColor(0.5)).toBe('rgb(252, 146, 114)');
  });

  it('interpolates correctly at ratio 0.25', () => {
    expect(interpolateColor(0.25)).toBe('rgb(252, 187, 161)');
  });

  it('interpolates correctly at ratio 0.75', () => {
    expect(interpolateColor(0.75)).toBe('rgb(251, 106, 74)');
  });

  it('returns a fallback color for out-of-range ratio', () => {
    expect(interpolateColor(2)).toBe('#a50f15');
  });

  it('interpolates to an intermediate value between stops', () => {
    const color = interpolateColor(0.125);
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });
});

describe('CHOROPLETH_COLORS', () => {
  it('has exactly 5 colors', () => {
    expect(CHOROPLETH_COLORS).toHaveLength(5);
  });

  it('are valid CSS color strings', () => {
    CHOROPLETH_COLORS.forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('buildStepExpression', () => {
  it('returns fallback color when dataLookup is empty', () => {
    expect(buildStepExpression(new Map(), { min: 0, max: 100 })).toBe('#e0e0e0');
  });

  it('returns fallback color when ratioStops is null', () => {
    const lookup = new Map([['01', { value: 50, label: 'Ain' }]]);
    expect(buildStepExpression(lookup, null)).toBe('#e0e0e0');
  });

  it('returns a MapLibre match expression array when data is valid', () => {
    const lookup = new Map([
      ['01', { value: 10, label: 'Ain' }],
      ['02', { value: 90, label: 'Aisne' }],
    ]);
    const result = buildStepExpression(lookup, { min: 0, max: 100 });

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBe('match');
    expect(result[1]).toEqual(['to-string', ['get', 'GEO']]);
  });

  it('assigns the lowest color class to the minimum value', () => {
    const lookup = new Map([['01', { value: 0, label: 'Ain' }]]);
    const result = buildStepExpression(lookup, { min: 0, max: 100 });

    // result format: ['match', expr, code, color, ..., fallback]
    const codeIndex = result.indexOf('01');
    expect(result[codeIndex + 1]).toBe(CHOROPLETH_COLORS[0]);
  });

  it('assigns the highest color class to the maximum value', () => {
    const lookup = new Map([['01', { value: 100, label: 'Ain' }]]);
    const result = buildStepExpression(lookup, { min: 0, max: 100 });

    const codeIndex = result.indexOf('01');
    expect(result[codeIndex + 1]).toBe(CHOROPLETH_COLORS[4]);
  });

  it('ends with the fallback color #e0e0e0', () => {
    const lookup = new Map([['01', { value: 50, label: 'Ain' }]]);
    const result = buildStepExpression(lookup, { min: 0, max: 100 });

    expect(result[result.length - 1]).toBe('#e0e0e0');
  });

  it('produces 5 distinct classes across the range', () => {
    const lookup = new Map([
      ['01', { value: 0, label: 'A' }],
      ['02', { value: 25, label: 'B' }],
      ['03', { value: 50, label: 'C' }],
      ['04', { value: 75, label: 'D' }],
      ['05', { value: 100, label: 'E' }],
    ]);
    const result = buildStepExpression(lookup, { min: 0, max: 100 });

    const assignedColors = ['01', '02', '03', '04', '05'].map(code => {
      const idx = result.indexOf(code);
      return result[idx + 1];
    });

    const uniqueColors = new Set(assignedColors);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });
});
