import { useMemo } from 'react';

/**
 * Hook to build query parameters from range data
 * Automatically selects appropriate values for each dimension:
 * - TIME_PERIOD: Tries 2022, 2023, 2024, or last available
 * - Other dimensions: Prefers "_T" (total) or first available value
 * - Skips GEO and MEASURE dimensions
 * 
 * @param {Object} rangeData - Range metadata from /range endpoint
 * @param {Array} rangeData.range - Array of dimension objects with values
 * @returns {Object} Query parameters object (e.g., {TIME_PERIOD: '2022', SEX: '_T'})
 * 
 * @example
 * const { data: rangeData } = useRange('DS_RP_POPULATION_PRINC');
 * const queryParams = useMapQueryParams(rangeData);
 * // Returns: {TIME_PERIOD: '2022', SEX: '_T', AGE: '_T'}
 */
export const useMapQueryParams = (rangeData) => {
  return useMemo(() => {
    if (!rangeData?.range) return {};

    const params = {};

    rangeData.range.forEach(dimension => {
      const code = dimension.concept.code;
      const values = dimension.values || [];

      // Skip GEO and MEASURE dimensions
      if (code === 'GEO' || code === 'MEASURE') return;

      if (code === 'TIME_PERIOD') {
        // Try to find 2022, 2023, 2024, or use the last available value
        const timeValue = values.find(v => (v.id || v.code) === '2022') ||
                         values.find(v => (v.id || v.code) === '2023') ||
                         values.find(v => (v.id || v.code) === '2024') ||
                         values[values.length - 1];
        if (timeValue) {
          params.TIME_PERIOD = timeValue.id || timeValue.code;
        }
      } else {
        // For all other dimensions, try "_T" (total) or use first value
        const totalValue = values.find(v => (v.id || v.code) === '_T');
        const selectedValue = totalValue || values[0];

        if (selectedValue) {
          params[code] = selectedValue.id || selectedValue.code;
        }
      }
    });

    return params;
  }, [rangeData]);
};
