import { describe, it, expect } from 'vitest';
import { computeAgeRatio, normalizeCsvResponse, normalizeObservation } from './dataHelpers';

// Échantillon au format exact de l'endpoint Melodi /to-csv (BOM, séparateur ';',
// chaînes entre guillemets, colonne GEO = code nu + colonne GEO_OBJECT séparée).
const CSV_DEP =
  '﻿"GEO";"GEO_OBJECT";"SEX";"AGE";"RP_MEASURE";"OBS_STATUS";TIME_PERIOD;OBS_VALUE\n' +
  '"56";"DEP";"_T";"_T";"POP";"";2022;776103\n' +
  '"75";"DEP";"_T";"Y_GE80";"POP";"";2022;100000\n';

describe('normalizeCsvResponse', () => {
  it('produit des observations à plat avec GEO/GEO_OBJECT/OBS_VALUE', () => {
    const { observations } = normalizeCsvResponse(CSV_DEP);
    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({
      GEO: '56',
      GEO_OBJECT: 'DEP',
      SEX: '_T',
      AGE: '_T',
      OBS_VALUE: 776103,
    });
  });

  it('reconstruit GEO_FULL "millésime-niveau-code" pour le lookup de labels', () => {
    const { observations } = normalizeCsvResponse(CSV_DEP);
    expect(observations[0].GEO_FULL).toBe('2022-DEP-56');
  });

  it('renseigne GEO_LIB depuis la map de labels, sinon un fallback lisible', () => {
    const labels = new Map([['2022-DEP-56', 'Morbihan']]);
    const { observations } = normalizeCsvResponse(CSV_DEP, labels);
    expect(observations[0].GEO_LIB).toBe('Morbihan');
    // 75 absent de la map → fallback "GEO_OBJECT code".
    expect(observations[1].GEO_LIB).toBe('DEP 75');
  });

  it('convertit OBS_VALUE en nombre, null si vide', () => {
    const csv = '"GEO";"GEO_OBJECT";TIME_PERIOD;OBS_VALUE\n"56";"DEP";2022;\n';
    const { observations } = normalizeCsvResponse(csv);
    expect(observations[0].OBS_VALUE).toBeNull();
  });

  it('ignore les lignes vides en fin de corps', () => {
    const { observations } = normalizeCsvResponse(`${CSV_DEP}\n\n`);
    expect(observations).toHaveLength(2);
  });
});

describe('normalizeObservation (idempotence)', () => {
  it('laisse une observation déjà à plat inchangée sans map de labels', () => {
    const flat = normalizeCsvResponse(CSV_DEP).observations[0];
    expect(normalizeObservation(flat)).toBe(flat);
  });

  it('ré-enrichit seulement GEO_LIB sur une observation déjà à plat', () => {
    const flat = normalizeCsvResponse(CSV_DEP).observations[0]; // GEO_FULL 2022-DEP-56
    const labels = new Map([['2022-DEP-56', 'Morbihan']]);
    const result = normalizeObservation(flat, labels);
    expect(result.GEO_LIB).toBe('Morbihan');
    expect(result.GEO).toBe('56');
    expect(result.OBS_VALUE).toBe(776103);
  });
});

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
