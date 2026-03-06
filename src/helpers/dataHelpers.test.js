import { describe, it, expect } from 'vitest';
import { computeAgeRatio } from './dataHelpers';

describe('computeAgeRatio', () => {
  it('retourne des Maps vides si observations est undefined', () => {
    const { ratioLookup, ratioStops } = computeAgeRatio(undefined);
    expect(ratioLookup.size).toBe(0);
    expect(ratioStops).toBeNull();
  });

  it('retourne des Maps vides si observations est un tableau vide', () => {
    const { ratioLookup, ratioStops } = computeAgeRatio([]);
    expect(ratioLookup.size).toBe(0);
    expect(ratioStops).toBeNull();
  });

  it('calcule correctement le ratio elder/total × 100, arrondi 2 décimales', () => {
    const observations = [
      { AGE: '_T',     GEO: '56', OBS_VALUE: 1000, GEO_LIB: 'Morbihan' },
      { AGE: 'Y_GE80', GEO: '56', OBS_VALUE: 75,   GEO_LIB: 'Morbihan' },
    ];
    const { ratioLookup } = computeAgeRatio(observations);
    expect(ratioLookup.get('56').value).toBe(7.50);
  });

  it('conserve le label du département dans ratioLookup', () => {
    const observations = [
      { AGE: '_T',     GEO: '75', OBS_VALUE: 2000, GEO_LIB: 'Paris' },
      { AGE: 'Y_GE80', GEO: '75', OBS_VALUE: 100,  GEO_LIB: 'Paris' },
    ];
    const { ratioLookup } = computeAgeRatio(observations);
    expect(ratioLookup.get('75').label).toBe('Paris');
  });

  it('exclut les codes sans total', () => {
    const observations = [
      { AGE: 'Y_GE80', GEO: '01', OBS_VALUE: 50, GEO_LIB: 'Ain' },
    ];
    const { ratioLookup } = computeAgeRatio(observations);
    expect(ratioLookup.has('01')).toBe(false);
  });

  it('exclut les codes avec total = 0', () => {
    const observations = [
      { AGE: '_T',     GEO: '02', OBS_VALUE: 0,  GEO_LIB: 'Aisne' },
      { AGE: 'Y_GE80', GEO: '02', OBS_VALUE: 10, GEO_LIB: 'Aisne' },
    ];
    const { ratioLookup } = computeAgeRatio(observations);
    expect(ratioLookup.has('02')).toBe(false);
  });

  it('calcule correctement ratioStops min et max', () => {
    const observations = [
      { AGE: '_T',     GEO: '01', OBS_VALUE: 1000, GEO_LIB: 'Ain' },
      { AGE: 'Y_GE80', GEO: '01', OBS_VALUE: 50,   GEO_LIB: 'Ain' },
      { AGE: '_T',     GEO: '02', OBS_VALUE: 500,  GEO_LIB: 'Aisne' },
      { AGE: 'Y_GE80', GEO: '02', OBS_VALUE: 100,  GEO_LIB: 'Aisne' },
    ];
    const { ratioStops } = computeAgeRatio(observations);
    // '01': 50/1000*100 = 5.00, '02': 100/500*100 = 20.00
    expect(ratioStops.min).toBe(5.00);
    expect(ratioStops.max).toBe(20.00);
  });

  it('retourne ratioStops null si aucun ratio calculable', () => {
    const observations = [
      { AGE: '_T', GEO: '03', OBS_VALUE: 0, GEO_LIB: 'Allier' },
    ];
    const { ratioStops } = computeAgeRatio(observations);
    expect(ratioStops).toBeNull();
  });
});
