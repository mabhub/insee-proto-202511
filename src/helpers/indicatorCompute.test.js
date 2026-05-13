import { describe, it, expect } from 'vitest';
import { computeIndicator } from './indicatorCompute';

const ratioFormula = {
  type: 'ratio',
  numerator: { AGE: 'Y_GE80' },
  denominator: { AGE: '_T' },
};

describe('computeIndicator', () => {
  it('retourne lookup vide et stops null pour observations undefined', () => {
    const { lookup, stops } = computeIndicator(undefined, ratioFormula);
    expect(lookup.size).toBe(0);
    expect(stops).toBeNull();
  });

  it('retourne lookup vide et stops null si la formule est manquante', () => {
    const { lookup, stops } = computeIndicator([{ GEO: '01' }], null);
    expect(lookup.size).toBe(0);
    expect(stops).toBeNull();
  });

  it('retourne lookup vide si le type de formule est inconnu', () => {
    const { lookup, stops } = computeIndicator(
      [{ AGE: '_T', GEO: '01', OBS_VALUE: 10, GEO_LIB: 'Ain' }],
      { type: 'unknown' },
    );
    expect(lookup.size).toBe(0);
    expect(stops).toBeNull();
  });

  it('calcule le ratio numerator/denominator × 100 par GEO', () => {
    const observations = [
      { AGE: '_T', GEO: '56', OBS_VALUE: 1000, GEO_LIB: 'Morbihan' },
      { AGE: 'Y_GE80', GEO: '56', OBS_VALUE: 75, GEO_LIB: 'Morbihan' },
    ];
    const { lookup } = computeIndicator(observations, ratioFormula);
    expect(lookup.get('56')).toEqual({ value: 7.5, label: 'Morbihan' });
  });

  it('exclut les GEO sans numérateur', () => {
    const observations = [
      { AGE: '_T', GEO: '01', OBS_VALUE: 1000, GEO_LIB: 'Ain' },
    ];
    const { lookup } = computeIndicator(observations, ratioFormula);
    expect(lookup.has('01')).toBe(false);
  });

  it('exclut les GEO avec dénominateur nul', () => {
    const observations = [
      { AGE: '_T', GEO: '02', OBS_VALUE: 0, GEO_LIB: 'Aisne' },
      { AGE: 'Y_GE80', GEO: '02', OBS_VALUE: 10, GEO_LIB: 'Aisne' },
    ];
    const { lookup } = computeIndicator(observations, ratioFormula);
    expect(lookup.has('02')).toBe(false);
  });

  it('calcule stops min et max sur plusieurs GEO', () => {
    const observations = [
      { AGE: '_T', GEO: '01', OBS_VALUE: 1000, GEO_LIB: 'Ain' },
      { AGE: 'Y_GE80', GEO: '01', OBS_VALUE: 50, GEO_LIB: 'Ain' },
      { AGE: '_T', GEO: '02', OBS_VALUE: 500, GEO_LIB: 'Aisne' },
      { AGE: 'Y_GE80', GEO: '02', OBS_VALUE: 100, GEO_LIB: 'Aisne' },
    ];
    const { stops } = computeIndicator(observations, ratioFormula);
    expect(stops).toEqual({ min: 5, max: 20 });
  });

  it('supporte une autre dimension (ACTIVITY) pour la formule ratio', () => {
    const formula = {
      type: 'ratio',
      numerator: { ACTIVITY: 'BE' },
      denominator: { ACTIVITY: '_T' },
    };
    const observations = [
      { ACTIVITY: '_T', GEO: '75', OBS_VALUE: 400, GEO_LIB: 'Paris' },
      { ACTIVITY: 'BE', GEO: '75', OBS_VALUE: 40, GEO_LIB: 'Paris' },
    ];
    const { lookup } = computeIndicator(observations, formula);
    expect(lookup.get('75').value).toBe(10);
  });
});
