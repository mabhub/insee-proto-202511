import { describe, it, expect } from 'vitest';
import {
  interpolateColor,
  CHOROPLETH_COLORS,
  buildStepExpression,
  buildProportionalCircleExpression,
  computeClassBreaks,
  buildClassIndexLookup,
  FEATURE_STATE_COLOR_EXPRESSION,
} from './colorHelpers';

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
    expect(uniqueColors.size).toBe(5);
  });
});

describe('buildClassIndexLookup', () => {
  it('retourne une Map vide si dataLookup est vide', () => {
    expect(buildClassIndexLookup(new Map(), { min: 0, max: 100 }).size).toBe(0);
  });

  it('retourne une Map vide si ratioStops est null', () => {
    const lookup = new Map([['01', { value: 50, label: 'Ain' }]]);
    expect(buildClassIndexLookup(lookup, null).size).toBe(0);
  });

  it('assigne la classe 0 au minimum et 4 au maximum (linéaire)', () => {
    const lookup = new Map([
      ['01', { value: 0, label: 'A' }],
      ['02', { value: 100, label: 'B' }],
    ]);
    const idx = buildClassIndexLookup(lookup, { min: 0, max: 100 });
    expect(idx.get('01')).toBe(0);
    expect(idx.get('02')).toBe(4);
  });

  it('produit 5 classes distinctes réparties sur la plage (linéaire)', () => {
    const lookup = new Map([
      ['01', { value: 0, label: 'A' }],
      ['02', { value: 25, label: 'B' }],
      ['03', { value: 50, label: 'C' }],
      ['04', { value: 75, label: 'D' }],
      ['05', { value: 100, label: 'E' }],
    ]);
    const idx = buildClassIndexLookup(lookup, { min: 0, max: 100 });
    expect(new Set(idx.values()).size).toBe(5);
  });

  it('répartit les valeurs sur plusieurs classes en échelle log', () => {
    const lookup = new Map([
      ['01', { value: 1, label: 'A' }],
      ['02', { value: 10, label: 'B' }],
      ['03', { value: 100, label: 'C' }],
      ['04', { value: 1000, label: 'D' }],
      ['05', { value: 100000, label: 'E' }],
    ]);
    const idx = buildClassIndexLookup(lookup, { min: 1, max: 100000 }, { scale: 'log' });
    expect(new Set(idx.values()).size).toBeGreaterThan(2);
  });
});

describe('computeClassBreaks', () => {
  it('produces 6 evenly spaced breaks for a linear scale', () => {
    const breaks = computeClassBreaks({ min: 0, max: 100 }, 'linear');
    expect(breaks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('defaults to linear when scale is omitted', () => {
    const breaks = computeClassBreaks({ min: 0, max: 100 });
    expect(breaks[0]).toBe(0);
    expect(breaks[5]).toBe(100);
  });

  it('produces geometrically spaced breaks for a log scale', () => {
    const breaks = computeClassBreaks({ min: 1, max: 100000 }, 'log');
    expect(breaks).toHaveLength(6);
    expect(breaks[0]).toBeCloseTo(1, 5);
    expect(breaks[5]).toBeCloseTo(100000, 0);
    // Ratio between consecutive breaks should be constant
    const ratio = breaks[1] / breaks[0];
    for (let i = 1; i < 5; i++) {
      expect(breaks[i + 1] / breaks[i]).toBeCloseTo(ratio, 5);
    }
  });

  it('falls back to linear when min is not strictly positive', () => {
    const breaks = computeClassBreaks({ min: 0, max: 100 }, 'log');
    expect(breaks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('falls back to linear when max is not strictly greater than min', () => {
    const breaks = computeClassBreaks({ min: 5, max: 5 }, 'log');
    expect(breaks).toEqual([5, 5, 5, 5, 5, 5]);
  });
});

describe('buildStepExpression — log scale', () => {
  it('uses geometric breaks when scale=log', () => {
    const lookup = new Map([
      ['01', { value: 1, label: 'A' }],
      ['02', { value: 10, label: 'B' }],
      ['03', { value: 100, label: 'C' }],
      ['04', { value: 1000, label: 'D' }],
      ['05', { value: 100000, label: 'E' }],
    ]);
    const result = buildStepExpression(lookup, { min: 1, max: 100000 }, { scale: 'log' });
    const colorFor = (code) => result[result.indexOf(code) + 1];

    // With linear scale, 1, 10, 100, 1000 would all land in class 0 (< 20000).
    // With log scale, they should be spread across classes.
    const assigned = new Set([
      colorFor('01'),
      colorFor('02'),
      colorFor('03'),
      colorFor('04'),
      colorFor('05'),
    ]);
    expect(assigned.size).toBeGreaterThan(2);
  });
});

describe('buildProportionalCircleExpression', () => {
  it('retourne minRadius si dataLookup est vide', () => {
    expect(buildProportionalCircleExpression(new Map(), { min: 0, max: 100 })).toBe(4);
  });

  it('retourne minRadius si colorStops est null', () => {
    const lookup = new Map([['01', { value: 50, label: 'Ain' }]]);
    expect(buildProportionalCircleExpression(lookup, null)).toBe(4);
  });

  it('retourne minRadius personnalisé si passé en paramètre', () => {
    expect(buildProportionalCircleExpression(new Map(), null, 8, 60)).toBe(8);
  });

  it('retourne une expression MapLibre avec "match" comme premier élément', () => {
    const lookup = new Map([
      ['01', { value: 0, label: 'Ain' }],
      ['02', { value: 100, label: 'Aisne' }],
    ]);
    const result = buildProportionalCircleExpression(lookup, { min: 0, max: 100 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBe('match');
  });

  it('normalise linéairement : min → minRadius, max → maxRadius', () => {
    const lookup = new Map([
      ['01', { value: 0,   label: 'Min' }],
      ['02', { value: 100, label: 'Max' }],
    ]);
    const result = buildProportionalCircleExpression(lookup, { min: 0, max: 100 }, 4, 40);

    const idx01 = result.indexOf('01');
    const idx02 = result.indexOf('02');
    expect(result[idx01 + 1]).toBe(4);  // 0% → minRadius
    expect(result[idx02 + 1]).toBe(40); // 100% → maxRadius
  });

  it('se termine par le rayon par défaut (minRadius)', () => {
    const lookup = new Map([['01', { value: 50, label: 'Ain' }]]);
    const result = buildProportionalCircleExpression(lookup, { min: 0, max: 100 });
    expect(result[result.length - 1]).toBe(4);
  });
});
