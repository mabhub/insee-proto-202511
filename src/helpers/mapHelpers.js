// src/helpers/mapHelpers.js
// Utilitaires purs pour les interactions cartographiques

/**
 * Construit les informations du popup à partir des features cliquées.
 *
 * @param {Array} features - Résultat de queryRenderedFeatures
 * @param {Map<string, {value: number, label: string}>} dataLookup - Code → {value, label}
 * @param {{lng: number, lat: number}} lngLat - Coordonnées du clic
 * @returns {{ longitude: number, latitude: number, label: string, value: number|undefined }|null}
 */
export const buildPopupInfo = (features, dataLookup, lngLat) => {
  if (!features?.length) return null;

  const props = features[0].properties;
  const code = props.GEO;
  const entry = dataLookup.get(code);

  return {
    longitude: lngLat.lng,
    latitude: lngLat.lat,
    label: entry?.label || props.GEO_LIB || code,
    value: entry?.value,
  };
};
