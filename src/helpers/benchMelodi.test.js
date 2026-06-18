import { describe, it, expect } from 'vitest';
import { parseJson, parseCsv } from './benchMelodi';

describe('parseJson', () => {
  it('aplatit dimensions/measures et décompose le GEO "année-niveau-code"', () => {
    const text = JSON.stringify({
      observations: [
        {
          dimensions: { GEO: '2025-COM-13071', SEX: '_T', AGE: '_T' },
          measures: { OBS_VALUE_NIVEAU: { value: 22423 } },
        },
      ],
    });
    expect(parseJson(text)).toEqual([
      {
        GEO_OBJECT: 'COM',
        GEO: '13071',
        GEO_FULL: '2025-COM-13071',
        SEX: '_T',
        AGE: '_T',
        OBS_VALUE: 22423,
      },
    ]);
  });

  it('gère le format GEO "niveau-code" (2 segments)', () => {
    const text = JSON.stringify({
      observations: [{ dimensions: { GEO: 'DEP-56' }, measures: {} }],
    });
    const [row] = parseJson(text);
    expect(row.GEO_OBJECT).toBe('DEP');
    expect(row.GEO).toBe('56');
    expect(row.OBS_VALUE).toBeNull();
  });

  it('renvoie un tableau vide sans observations', () => {
    expect(parseJson(JSON.stringify({}))).toEqual([]);
  });
});

describe('parseCsv', () => {
  it('parse l\'en-tête (BOM + guillemets) et convertit OBS_VALUE en nombre', () => {
    const text =
      '﻿"GEO";"GEO_OBJECT";"SEX";"AGE";"RP_MEASURE";TIME_PERIOD;OBS_VALUE\n' +
      '"13071";"COM";"_T";"_T";"POP";2022;22423\n';
    expect(parseCsv(text)).toEqual([
      {
        GEO: '13071',
        GEO_OBJECT: 'COM',
        SEX: '_T',
        AGE: '_T',
        RP_MEASURE: 'POP',
        TIME_PERIOD: '2022',
        OBS_VALUE: 22423,
      },
    ]);
  });

  it('ignore les lignes vides et met OBS_VALUE à null si absente', () => {
    const text = '"GEO";OBS_VALUE\n"13071";\n\n';
    const rows = parseCsv(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].OBS_VALUE).toBeNull();
  });
});
