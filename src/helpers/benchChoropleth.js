// src/helpers/benchChoropleth.js
// Benchmark de la coloration choroplèthe : compare l'ancien mécanisme (expression
// MapLibre `match` massive + setPaintProperty, qui retessele) au nouveau (feature-state,
// qui ne retessele pas), sur les features PMTiles réellement chargées. Utilisé par la
// page /bench-choropleth. Aucune dépendance à l'API Melodi.
import { FEATURE_STATE_COLOR_EXPRESSION, CHOROPLETH_COLORS } from './colorHelpers';

/**
 * Classe 0..4 déterministe par identifiant (hash simple, stable, bien réparti).
 * Indépendant des données Melodi — sert de jeu de valeurs reproductible pour le bench.
 * @param {Array<string|number>} ids - Identifiants de features (codes GEO promus)
 * @returns {Map<string|number, number>} id → classe 0..4
 */
export const buildSyntheticClassIndex = (ids) => {
  const out = new Map();
  for (const id of ids) {
    const s = String(id);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    out.set(id, Math.abs(h) % 5);
  }
  return out;
};

/** Attend la fin du rendu (idle) après avoir forcé un repaint. */
const waitIdle = (map) =>
  new Promise((resolve) => {
    map.once('idle', resolve);
    map.triggerRepaint();
  });

/**
 * Mesure l'ancien mécanisme : expression `match` code→couleur (une branche par id)
 * appliquée via setPaintProperty (déclenche une retesselation). La classe de chaque
 * commune est décalée de `+r` à chaque run pour empêcher tout court-circuit de MapLibre
 * sur valeur identique.
 * @param {object} map - Instance MapLibre
 * @param {object} params
 * @param {string} params.layerId - Couche fill à recolorer
 * @param {Array<string|number>} params.ids - Identifiants des features
 * @param {Map<string|number, number>} params.classIndex - Jeu de valeurs synthétique
 * @param {number} params.runs - Nombre de runs (moyennés)
 * @returns {Promise<{buildExprMs: number, totalMs: number}>} moyennes sur `runs`
 */
export const benchMatchRecolor = async (map, { layerId, ids, classIndex, runs }) => {
  let buildSum = 0;
  let totalSum = 0;
  for (let r = 0; r < runs; r++) {
    const t0 = performance.now();
    const expr = ['match', ['to-string', ['get', 'GEO']]];
    for (let i = 0; i < ids.length; i++) {
      const cls = ((classIndex.get(ids[i]) ?? 0) + r) % 5;
      expr.push(String(ids[i]), CHOROPLETH_COLORS[cls]);
    }
    expr.push('#e0e0e0');
    const t1 = performance.now();
    map.setPaintProperty(layerId, 'fill-color', expr);
    await waitIdle(map);
    const t2 = performance.now();
    buildSum += t1 - t0;
    totalSum += t2 - t0;
  }
  return { buildExprMs: buildSum / runs, totalMs: totalSum / runs };
};

/**
 * Mesure le nouveau mécanisme (levier 4) : expression constante feature-state posée une
 * fois, puis setFeatureState par feature à chaque run (pas de retesselation). La classe
 * de chaque commune est décalée de `+r` à chaque run.
 * @param {object} map - Instance MapLibre
 * @param {object} params
 * @param {string} params.sourceId - Id de la source vectorielle
 * @param {string} params.sourceLayer - Nom de la source-layer
 * @param {string} params.layerId - Couche fill à recolorer
 * @param {Array<string|number>} params.ids - Identifiants des features
 * @param {Map<string|number, number>} params.classIndex - Jeu de valeurs synthétique
 * @param {number} params.runs - Nombre de runs (moyennés)
 * @returns {Promise<{setStateMs: number, totalMs: number}>} moyennes sur `runs`
 */
export const benchFeatureStateRecolor = async (map, { sourceId, sourceLayer, layerId, ids, classIndex, runs }) => {
  map.setPaintProperty(layerId, 'fill-color', FEATURE_STATE_COLOR_EXPRESSION);
  let setSum = 0;
  let totalSum = 0;
  for (let r = 0; r < runs; r++) {
    const t0 = performance.now();
    for (let i = 0; i < ids.length; i++) {
      const cls = ((classIndex.get(ids[i]) ?? 0) + r) % 5;
      map.setFeatureState(
        { source: sourceId, sourceLayer, id: ids[i] },
        { classIndex: cls },
      );
    }
    const t1 = performance.now();
    await waitIdle(map);
    const t2 = performance.now();
    setSum += t1 - t0;
    totalSum += t2 - t0;
  }
  return { setStateMs: setSum / runs, totalMs: totalSum / runs };
};
