/**
 * Normalize observation from new API structure
 * Converts from dimensions/measures structure to flat structure
 * @param {Object} obs - Raw observation from API
 * @param {Map<string, string>} geoLabelsMap - Optional map of GEO IDs to labels
 * @returns {Object} Normalized observation
 */
export const normalizeObservation = (obs, geoLabelsMap = null) => {
  if (!obs) return null;

  // Idempotence : une observation déjà à plat (issue de normalizeCsvResponse,
  // sans bloc `dimensions`) ne doit pas être re-décomposée — on se contente de
  // (ré)appliquer le libellé géographique si une map de labels est fournie.
  if (!obs.dimensions && obs.GEO_FULL !== undefined) {
    return geoLabelsMap?.get(obs.GEO_FULL)
      ? { ...obs, GEO_LIB: geoLabelsMap.get(obs.GEO_FULL) }
      : obs;
  }

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

// Découpe une ligne CSV Melodi (séparateur ';', valeurs chaîne entre
// guillemets) en cellules dé-quotées. Parseur minimal : les valeurs Melodi ne
// contiennent ni ';' ni '"' échappé.
const splitCsvLine = (line) =>
  line.split(';').map((cell) => (cell.charCodeAt(0) === 34 ? cell.slice(1, -1) : cell));

/**
 * Normalize a Melodi /to-csv response body into the same flat observation
 * shape as normalizeResponse(JSON).
 *
 * The CSV layout differs from the JSON one: GEO already holds the bare code
 * (e.g. "56") and GEO_OBJECT is a dedicated column ("DEP"), whereas the JSON
 * GEO is composite ("2022-DEP-56"). So GEO/GEO_OBJECT are read straight from
 * their columns, and GEO_FULL is rebuilt as "millésime-niveau-code" to keep the
 * geoLabelsMap lookup (keyed by GEO_FULL) working. Every other column is kept
 * as-is alongside, and OBS_VALUE is coerced to a number (null when empty).
 *
 * @param {string} text - Raw CSV body (BOM-prefixed, ';'-separated)
 * @param {Map<string, string>} [geoLabelsMap] - Optional GEO_FULL → label map
 * @returns {{observations: Array<Object>}} Response with normalized observations
 */
export const normalizeCsvResponse = (text, geoLabelsMap = null) => {
  const lines = text.split('\n');
  if (lines.length < 2) return { observations: [] };

  // L'en-tête peut porter un BOM UTF-8 en tête de première cellule.
  const header = splitCsvLine(lines[0].replace(/^﻿/, ''));
  const observations = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue; // lignes vides (fin de corps notamment)
    const cells = splitCsvLine(lines[i]);
    const row = {};
    for (let c = 0; c < header.length; c++) row[header[c]] = cells[c] ?? '';

    const geo = row.GEO ?? '';
    const geoObject = row.GEO_OBJECT ?? '';
    const timePeriod = row.TIME_PERIOD ?? '';
    const geoFull = [timePeriod, geoObject, geo].filter(Boolean).join('-');

    row.GEO = geo;
    row.GEO_OBJECT = geoObject;
    row.GEO_FULL = geoFull;
    row.GEO_LIB = geoLabelsMap?.get(geoFull) || `${geoObject} ${geo}`.trim();
    row.OBS_VALUE = row.OBS_VALUE === '' ? null : Number(row.OBS_VALUE);
    observations.push(row);
  }

  return { observations };
};
