import { useMemo } from 'react';

/**
 * Hook to filter datasets that have geographic data (GEO dimension)
 * Filters catalog datasets to keep only those with a GEO dimension in their structure
 * 
 * @param {Array} allDatasets - All datasets from catalog API
 * @returns {Array} Filtered array of datasets containing GEO dimension
 * 
 * @example
 * const { data: allDatasets } = useCatalogAll();
 * const geoDatasets = useGeographicDatasets(allDatasets);
 * // Returns only datasets with ordreComposants containing 'GEO'
 */
export const useGeographicDatasets = (allDatasets = []) => {
  return useMemo(() => {
    const filtered = allDatasets.filter(ds => {
      // Must be a local dataset (DS_*)
      if (!ds.identifier.startsWith('DS_')) return false;

      // Check if ordreComposants contains GEO
      return ds.ordreComposants?.includes('GEO');
    });

    console.log(`Found ${filtered.length} geographic datasets out of ${allDatasets.length} total`);

    return filtered;
  }, [allDatasets]);
};
