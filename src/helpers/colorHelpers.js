// src/helpers/colorHelpers.js
// Utilitaires de couleur partagés entre les composants cartographiques

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
 * Construit une expression MapLibre `match` qui attribue une couleur de classe
 * à chaque territoire selon 5 seuils égaux entre min et max.
 *
 * Choix technique : on utilise `match` avec le code court (ex. "01") plutôt qu'une
 * expression `step` sur la valeur directement, car les données sont dans une Map JS
 * et non dans les propriétés des features PMTiles.
 *
 * @param {Map<string, {value: number, label: string}>} dataLookup - Données par code court
 * @param {{min: number, max: number}|null} ratioStops - Bornes min/max
 * @returns {Array|string} Expression MapLibre ou couleur de repli
 */
export const buildStepExpression = (dataLookup, ratioStops) => {
  if (!dataLookup.size || !ratioStops) return '#e0e0e0';

  // Découpage en 5 classes d'amplitude égale
  const step = (ratioStops.max - ratioStops.min) / 5;
  const breaks = Array.from({ length: 4 }, (_, i) => ratioStops.min + step * (i + 1));

  return [
    'match',
    ['to-string', ['get', 'GEO']],
    ...Array.from(dataLookup.entries()).flatMap(([code, { value }]) => {
      // Compte combien de seuils la valeur dépasse → indice de classe 0..4
      const idx = breaks.filter(b => value >= b).length;
      return [code, CHOROPLETH_COLORS[idx]];
    }),
    '#e0e0e0', // Couleur des départements sans donnée
  ];
};
