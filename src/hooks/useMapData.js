import { useMemo } from 'react';

/**
 * Hook to transform API data into map-ready format with color stops
 * Extracts EPCI codes from full GEO strings and calculates min/max for color scale
 * 
 * @param {Object} geoData - Geographic data from Melodi API
 * @param {Array} geoData.observations - Array of observation objects
 * @returns {Object} Transformed data for map visualization
 * @returns {Map} returns.dataLookup - Map of code → {value, label, geoObject}
 * @returns {Object|null} returns.colorStops - {min, max} values for color interpolation
 * 
 * @example
 * const { data: geoData } = useAllTerritories('DS_RP_POPULATION_PRINC', 'EPCI', params);
 * const { dataLookup, colorStops } = useMapData(geoData);
 * // dataLookup: Map('200070712' → {value: 145230, label: '...', geoObject: 'EPCI'})
 * // colorStops: {min: 3915, max: 7115576}
 */
export const useMapData = (geoData) => {
  // Create lookup map: code -> {value, label, geoObject}
  const dataLookup = useMemo(() => {
    if (!geoData?.observations) return new Map();

    const lookup = new Map();
    geoData.observations.forEach(obs => {
      // Extract code from "2025-EPCI-200070712" -> "200070712"
      const parts = obs.GEO.split('-');
      const code = parts[parts.length - 1];

      lookup.set(code, {
        value: Number(obs.OBS_VALUE) || 0,
        label: obs.GEO_LIB,
        geoObject: obs.GEO_OBJECT,
      });
    });

    if (lookup.size > 0) {
      const firstEntries = Array.from(lookup.entries()).slice(0, 3);
      console.log('DataLookup sample:', firstEntries);
      console.log('Total territories:', lookup.size);
    }

    return lookup;
  }, [geoData]);

  // Calculate min/max for color interpolation
  const colorStops = useMemo(() => {
    if (dataLookup.size === 0) return null;

    const values = Array.from(dataLookup.values()).map(d => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [dataLookup]);

  return { dataLookup, colorStops };
};
