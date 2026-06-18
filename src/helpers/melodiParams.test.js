import { describe, it, expect } from 'vitest';
import { normalizeFilter, appendMelodiParams, buildDataUrl } from './melodiParams';

describe('normalizeFilter', () => {
  it('renvoie un objet inchangé (passthrough)', () => {
    const filter = { SEX: '_T', AGE: ['_T', 'Y_LT20'] };
    expect(normalizeFilter(filter)).toBe(filter);
  });

  it('parse une chaîne query param en objet', () => {
    expect(normalizeFilter('SEX=_T&TIME_PERIOD=2022')).toEqual({
      SEX: '_T',
      TIME_PERIOD: '2022',
    });
  });

  it('regroupe les clés répétées en tableau, dans l\'ordre', () => {
    expect(normalizeFilter('AGE=_T&AGE=Y_LT20&AGE=Y_GE80')).toEqual({
      AGE: ['_T', 'Y_LT20', 'Y_GE80'],
    });
  });

  it('ignore un & ou ? de tête', () => {
    expect(normalizeFilter('?SEX=_T&AGE=_T')).toEqual({ SEX: '_T', AGE: '_T' });
  });

  it('renvoie un objet vide par défaut', () => {
    expect(normalizeFilter()).toEqual({});
  });
});

describe('appendMelodiParams', () => {
  it('déplie les tableaux et accepte une chaîne query param équivalente', () => {
    const fromObject = appendMelodiParams(new URL('https://x/'), { AGE: ['_T', 'Y_LT20'] });
    const fromString = appendMelodiParams(new URL('https://x/'), 'AGE=_T&AGE=Y_LT20');
    expect(fromObject.toString()).toBe(fromString.toString());
    expect(fromObject.toString()).toBe('https://x/?AGE=_T&AGE=Y_LT20');
  });
});

describe('buildDataUrl', () => {
  it('produit la même URL depuis un objet et depuis une chaîne query param', () => {
    const fromObject = buildDataUrl('DS_X', { SEX: '_T', AGE: ['_T', 'Y_LT20'], GEO: 'DEP' });
    const fromString = buildDataUrl('DS_X', 'SEX=_T&AGE=_T&AGE=Y_LT20&GEO=DEP');
    expect(fromObject).toBe(fromString);
  });

  it('cible l\'endpoint /to-csv avec l\'option csv', () => {
    expect(buildDataUrl('DS_X', { GEO: 'DEP' }, { csv: true })).toContain('/data/DS_X/to-csv');
  });
});
