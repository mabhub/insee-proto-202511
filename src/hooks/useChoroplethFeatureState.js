// src/hooks/useChoroplethFeatureState.js
// Coloration choroplèthe découplée de la géométrie : injecte un indice de classe
// (0..4) par feature via setFeatureState, réappliqué au fil du chargement des tuiles.
import { useEffect } from 'react';

/**
 * Pose un feature-state { classIndex } pour chaque entrée du lookup.
 * Fonction pure (hors React) pour testabilité ; no-op si map absent ou lookup vide.
 *
 * @param {object|null} map - Instance MapLibre (getMap())
 * @param {string} sourceId - Id de la source vectorielle
 * @param {string} sourceLayer - Nom de la source-layer (ex. 'com_contour')
 * @param {Map<string, number>} classIndexLookup - code → indice de classe 0..4
 */
export const applyFeatureStates = (map, sourceId, sourceLayer, classIndexLookup) => {
  if (!map || !classIndexLookup.size) return;
  for (const [code, classIndex] of classIndexLookup) {
    map.setFeatureState(
      { source: sourceId, sourceLayer, id: code },
      { classIndex },
    );
  }
};

/**
 * Applique les indices de classe via feature-state et les maintient à jour :
 * - pose initiale dès que map + lookup sont prêts ;
 * - réapplication débouncée (rAF) sur chaque 'sourcedata' de notre source, pour
 *   colorer les tuiles PMTiles arrivant au fil du pan/zoom ;
 * - purge (removeFeatureState) puis repose au changement de lookup ;
 * - désabonnement + annulation du rAF au démontage.
 *
 * @param {object} params
 * @param {object|null} params.map - Instance MapLibre (getMap()) ou null
 * @param {string} params.sourceId - Id de la source vectorielle
 * @param {string} params.sourceLayer - Nom de la source-layer
 * @param {Map<string, number>} params.classIndexLookup - code → indice de classe 0..4
 */
export const useChoroplethFeatureState = ({ map, sourceId, sourceLayer, classIndexLookup }) => {
  useEffect(() => {
    if (!map) return undefined;

    let rafId = null;
    const scheduleApply = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyFeatureStates(map, sourceId, sourceLayer, classIndexLookup);
      });
    };

    // Purge les states d'un lookup précédent, puis pose le lookup courant.
    map.removeFeatureState({ source: sourceId, sourceLayer });
    applyFeatureStates(map, sourceId, sourceLayer, classIndexLookup);

    // Réapplique quand de nouvelles tuiles de NOTRE source arrivent.
    const handleSourceData = (e) => {
      if (e.sourceId !== sourceId) return;
      if (e.sourceDataType === 'metadata') return;
      if (!e.tile) return;
      scheduleApply();
    };
    map.on('sourcedata', handleSourceData);

    return () => {
      map.off('sourcedata', handleSourceData);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [map, sourceId, sourceLayer, classIndexLookup]);
};
