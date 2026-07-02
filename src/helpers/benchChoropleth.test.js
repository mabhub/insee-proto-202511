import { describe, it, expect } from 'vitest';
import { buildSyntheticClassIndex } from './benchChoropleth';

describe('buildSyntheticClassIndex', () => {
  it('produit une classe pour chaque id', () => {
    const idx = buildSyntheticClassIndex(['01', '02', '13071']);
    expect(idx.size).toBe(3);
  });

  it('est déterministe (même entrée → même sortie)', () => {
    const a = buildSyntheticClassIndex(['01', '02', '03']);
    const b = buildSyntheticClassIndex(['01', '02', '03']);
    expect([...a.entries()]).toEqual([...b.entries()]);
  });

  it('assigne des classes dans [0, 4]', () => {
    const idx = buildSyntheticClassIndex(['01', '02', '13071', '75056', '99999', 'ABC']);
    for (const v of idx.values()) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(4);
    }
  });

  it('répartit sur plusieurs classes pour un grand échantillon', () => {
    const ids = Array.from({ length: 500 }, (_, i) => String(10000 + i));
    const idx = buildSyntheticClassIndex(ids);
    expect(new Set(idx.values()).size).toBeGreaterThan(1);
  });
});
