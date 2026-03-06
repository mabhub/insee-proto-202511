import { describe, it, expect } from 'vitest';
import { buildPopupInfo } from './mapHelpers';

const dataLookup = new Map([
  ['56', { value: 7.5, label: 'Morbihan' }],
  ['75', { value: 5.2, label: 'Paris' }],
]);

describe('buildPopupInfo', () => {
  it('retourne null si features est vide', () => {
    expect(buildPopupInfo([], dataLookup, { lng: 2.3, lat: 48.8 })).toBeNull();
  });

  it('retourne null si features est undefined', () => {
    expect(buildPopupInfo(undefined, dataLookup, { lng: 2.3, lat: 48.8 })).toBeNull();
  });

  it('retourne un objet popup avec longitude et latitude', () => {
    const features = [{ properties: { GEO: '56', GEO_LIB: 'Morbihan' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: -3.1, lat: 47.7 });
    expect(result.longitude).toBe(-3.1);
    expect(result.latitude).toBe(47.7);
  });

  it('utilise le label de dataLookup en priorité', () => {
    const features = [{ properties: { GEO: '56', GEO_LIB: 'libellé PMTiles' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: 0, lat: 0 });
    expect(result.label).toBe('Morbihan');
  });

  it('utilise GEO_LIB si le code est absent de dataLookup', () => {
    const features = [{ properties: { GEO: '99', GEO_LIB: 'Territoire inconnu' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: 0, lat: 0 });
    expect(result.label).toBe('Territoire inconnu');
  });

  it('utilise le code si GEO_LIB est aussi absent', () => {
    const features = [{ properties: { GEO: '99' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: 0, lat: 0 });
    expect(result.label).toBe('99');
  });

  it('expose la value de dataLookup', () => {
    const features = [{ properties: { GEO: '75', GEO_LIB: 'Paris' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: 2.3, lat: 48.8 });
    expect(result.value).toBe(5.2);
  });

  it('retourne value undefined si le code est absent de dataLookup', () => {
    const features = [{ properties: { GEO: '99', GEO_LIB: 'Inconnu' } }];
    const result = buildPopupInfo(features, dataLookup, { lng: 0, lat: 0 });
    expect(result.value).toBeUndefined();
  });
});
