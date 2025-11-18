import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../config/api';
import { fetchRange, buildGeoLabelsMap } from '../services/rangeService';

/**
 * Hook to fetch range data for a dataset
 * @param {string} datasetId - Dataset identifier
 * @param {Object} options - React Query options
 * @returns {Object} React Query result with range data
 */
export const useRange = (datasetId, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.range.byId(datasetId),
    queryFn: () => fetchRange(datasetId),
    enabled: Boolean(datasetId),
    staleTime: 1000 * 60 * 60, // 1 hour - range data changes rarely
    ...options,
  });

/**
 * Hook to get GEO labels map for a dataset
 * @param {string} datasetId - Dataset identifier
 * @returns {Object} React Query result with geoLabelsMap
 */
export const useGeoLabels = (datasetId) => {
  const { data: rangeData, ...queryResult } = useRange(datasetId);
  
  const geoLabelsMap = rangeData ? buildGeoLabelsMap(rangeData) : new Map();
  
  return {
    ...queryResult,
    data: rangeData,
    geoLabelsMap,
  };
};
