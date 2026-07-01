import { describe, it, expect, vi } from 'vitest';
import { applyFeatureStates, resetAndApplyFeatureStates } from './useChoroplethFeatureState';

const makeMap = ({ hasSource = true } = {}) => ({
  setFeatureState: vi.fn(),
  removeFeatureState: vi.fn(),
  getSource: vi.fn(() => (hasSource ? {} : undefined)),
});

describe('applyFeatureStates', () => {
  it('pose un feature-state par entrée du lookup', () => {
    const map = makeMap();
    const lookup = new Map([['01', 0], ['13071', 4]]);
    applyFeatureStates(map, 'geo-2025-source', 'com_contour', lookup);

    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'geo-2025-source', sourceLayer: 'com_contour', id: '01' },
      { classIndex: 0 },
    );
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'geo-2025-source', sourceLayer: 'com_contour', id: '13071' },
      { classIndex: 4 },
    );
  });

  it('ne fait rien si map est absent', () => {
    expect(() => applyFeatureStates(null, 's', 'l', new Map([['01', 0]]))).not.toThrow();
  });

  it('ne fait rien si le lookup est vide', () => {
    const map = makeMap();
    applyFeatureStates(map, 's', 'l', new Map());
    expect(map.setFeatureState).not.toHaveBeenCalled();
  });
});

describe('resetAndApplyFeatureStates', () => {
  it('purge puis pose les states quand la source existe', () => {
    const map = makeMap({ hasSource: true });
    const lookup = new Map([['01', 2]]);
    resetAndApplyFeatureStates(map, 'geo-2025-source', 'com_contour', lookup);

    expect(map.removeFeatureState).toHaveBeenCalledWith({
      source: 'geo-2025-source',
      sourceLayer: 'com_contour',
    });
    expect(map.setFeatureState).toHaveBeenCalledTimes(1);
  });

  it('ne touche à rien si la source n’existe pas encore (évite le crash MapLibre)', () => {
    const map = makeMap({ hasSource: false });
    resetAndApplyFeatureStates(map, 'geo-2025-source', 'com_contour', new Map([['01', 2]]));

    expect(map.removeFeatureState).not.toHaveBeenCalled();
    expect(map.setFeatureState).not.toHaveBeenCalled();
  });

  it('ne fait rien si map est absent', () => {
    expect(() =>
      resetAndApplyFeatureStates(null, 's', 'l', new Map([['01', 0]])),
    ).not.toThrow();
  });
});
