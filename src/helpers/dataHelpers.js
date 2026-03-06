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
 * Calcule le ratio population 80+ / total en % par département.
 *
 * @param {Array} observations - Observations normalisées (avec AGE, GEO, OBS_VALUE, GEO_LIB)
 * @returns {{ ratioLookup: Map<string, {value: number, label: string}>, ratioStops: {min: number, max: number}|null }}
 */
export const computeAgeRatio = (observations) => {
  if (!observations?.length) return { ratioLookup: new Map(), ratioStops: null };

  const totals = new Map();
  const elders = new Map();

  observations.forEach(obs => {
    if (obs.AGE === '_T')     totals.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
    if (obs.AGE === 'Y_GE80') elders.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
  });

  const ratioLookup = new Map();
  totals.forEach(({ value: tot, label }, code) => {
    const elder = elders.get(code);
    if (elder && tot > 0) {
      ratioLookup.set(code, {
        value: +((elder.value / tot) * 100).toFixed(2),
        label,
      });
    }
  });

  const values = [...ratioLookup.values()].map(d => d.value);
  const ratioStops = ratioLookup.size
    ? { min: Math.min(...values), max: Math.max(...values) }
    : null;

  return { ratioLookup, ratioStops };
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
