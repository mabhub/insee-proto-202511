// src/helpers/colorHelpers.js
// Utilitaires de couleur partagés entre les composants cartographiques

/**
 * Construit l'expression MapLibre `match` pour le rayon des cercles proportionnels.
 * Le rayon est normalisé linéairement entre minRadius (valeur min) et maxRadius (valeur max).
 *
 * @param {Map<string, {value: number, label: string}>} dataLookup - Données par code court
 * @param {{min: number, max: number}|null} colorStops - Bornes pour la normalisation
 * @param {number} [minRadius=4] - Rayon minimal en pixels
 * @param {number} [maxRadius=40] - Rayon maximal en pixels
 * @returns {number|Array} Expression MapLibre ou rayon par défaut si pas de données
 */
export const buildProportionalCircleExpression = (dataLookup, colorStops, minRadius = 4, maxRadius = 40) => {
  if (!dataLookup.size || !colorStops) return minRadius;

  return [
    'match',
    ['to-string', ['get', 'GEO']],
    ...Array.from(dataLookup.entries()).flatMap(([code, { value }]) => {
      const ratio = (value - colorStops.min) / (colorStops.max - colorStops.min);
      return [code, minRadius + ratio * (maxRadius - minRadius)];
    }),
    minRadius,
  ];
};

/**
 * Interpole une couleur dans une rampe séquentielle rouge pâle → rouge sombre
 * pour une valeur normalisée entre 0 et 1.
 * Utilisé pour les choroplèthes à interpolation continue (ex. MapLayers.jsx).
 *
 * @param {number} ratio - Valeur normalisée [0, 1]
 * @returns {string} Couleur CSS rgb(...)
 */
export const interpolateColor = (ratio) => {
  const colors = [
    { stop: 0,    color: [254, 229, 217] },
    { stop: 0.25, color: [252, 187, 161] },
    { stop: 0.5,  color: [252, 146, 114] },
    { stop: 0.75, color: [251, 106, 74]  },
    { stop: 1,    color: [165, 15, 21]   },
  ];
  for (let i = 0; i < colors.length - 1; i++) {
    if (ratio >= colors[i].stop && ratio <= colors[i + 1].stop) {
      const t = (ratio - colors[i].stop) / (colors[i + 1].stop - colors[i].stop);
      const r = Math.round(colors[i].color[0] + (colors[i+1].color[0] - colors[i].color[0]) * t);
      const g = Math.round(colors[i].color[1] + (colors[i+1].color[1] - colors[i].color[1]) * t);
      const b = Math.round(colors[i].color[2] + (colors[i+1].color[2] - colors[i].color[2]) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return '#a50f15';
};

/**
 * Palette 5 classes pour choroplèthe discrète (rouge progressif).
 * Correspond aux 5 niveaux produits par buildStepExpression.
 */
export const CHOROPLETH_COLORS = ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#cb181d'];

/**
 * Calcule les bornes des 5 classes choroplèthe selon l'échelle demandée.
 *
 * - linear : 5 classes d'amplitude égale entre min et max.
 * - log    : 5 classes d'amplitude égale dans l'espace log(x). Nécessite min > 0 ;
 *            retombe sur 'linear' sinon.
 *
 * Retourne un tableau de 6 bornes (les 5 frontières inférieures + la borne max).
 *
 * @param {{min: number, max: number}} stops - Bornes globales min/max
 * @param {'linear'|'log'} [scale='linear'] - Échelle de découpage
 * @returns {number[]} Tableau de 6 bornes croissantes
 */
export const computeClassBreaks = ({ min, max }, scale = 'linear') => {
  if (scale === 'log' && min > 0 && max > min) {
    const lmin = Math.log(min);
    const lmax = Math.log(max);
    const lstep = (lmax - lmin) / 5;
    return Array.from({ length: 6 }, (_, i) => Math.exp(lmin + lstep * i));
  }
  const step = (max - min) / 5;
  return Array.from({ length: 6 }, (_, i) => min + step * i);
};

/**
 * Construit une expression MapLibre `match` qui attribue une couleur de classe
 * à chaque territoire selon 5 seuils entre min et max.
 *
 * Choix technique : on utilise `match` avec le code court (ex. "01") plutôt qu'une
 * expression `step` sur la valeur directement, car les données sont dans une Map JS
 * et non dans les propriétés des features PMTiles.
 *
 * @param {Map<string, {value: number, label: string}>} dataLookup - Données par code court
 * @param {{min: number, max: number}|null} ratioStops - Bornes min/max
 * @param {Object} [options]
 * @param {'linear'|'log'} [options.scale='linear'] - Échelle de découpage
 * @returns {Array|string} Expression MapLibre ou couleur de repli
 */
export const buildStepExpression = (dataLookup, ratioStops, { scale = 'linear' } = {}) => {
  if (!dataLookup.size || !ratioStops) return '#e0e0e0';

  const allBreaks = computeClassBreaks(ratioStops, scale);
  // 4 frontières internes pour assigner les 5 classes 0..4
  const innerBreaks = allBreaks.slice(1, 5);

  return [
    'match',
    ['to-string', ['get', 'GEO']],
    ...Array.from(dataLookup.entries()).flatMap(([code, { value }]) => {
      // Compte combien de seuils la valeur dépasse → indice de classe 0..4
      const idx = innerBreaks.filter((b) => value >= b).length;
      return [code, CHOROPLETH_COLORS[idx]];
    }),
    '#e0e0e0', // Couleur des entités sans donnée
  ];
};
