/**
 * Normalize observation from new API structure
 * Converts from dimensions/measures structure to flat structure
 * @param {Object} obs - Raw observation from API
 * @param {Map<string, string>} geoLabelsMap - Optional map of GEO IDs to labels
 * @returns {Object} Normalized observation
 */
export const normalizeObservation = (obs, geoLabelsMap = null) => {
  if (!obs) return null;

  // Extract GEO information
  const geoFull = obs.dimensions?.GEO || '';
  const geoParts = geoFull.split('-');
  
  // Format can be "2025-DEP-56" or "DEP-56"
  let geo, geoObject;
  if (geoParts.length === 3) {
    // Format: "2025-DEP-56"
    [, geoObject, geo] = geoParts;
  } else if (geoParts.length === 2) {
    // Format: "DEP-56"
    [geoObject, geo] = geoParts;
  } else {
    geoObject = '';
    geo = geoFull;
  }

  // Get label from map or use default
  const geoLib = geoLabelsMap?.get(geoFull) || `${geoObject} ${geo}`;

  // Extract value
  const value = obs.measures?.OBS_VALUE_NIVEAU?.value || null;

  return {
    ...obs.dimensions,
    GEO_OBJECT: geoObject,
    GEO: geo,
    GEO_FULL: geoFull,
    GEO_LIB: geoLib,
    OBS_VALUE: value,
    // Keep original structure for compatibility
    dimensions: obs.dimensions,
    measures: obs.measures,
  };
};

/**
 * Normalize API response observations
 * @param {Object} response - API response
 * @param {Map<string, string>} geoLabelsMap - Optional map of GEO IDs to labels
 * @returns {Object} Response with normalized observations
 */
export const normalizeResponse = (response, geoLabelsMap = null) => {
  if (!response?.observations) return response;

  return {
    ...response,
    observations: response.observations.map(obs => normalizeObservation(obs, geoLabelsMap)),
  };
};
