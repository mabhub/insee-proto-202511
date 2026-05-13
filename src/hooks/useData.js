import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { QUERY_KEYS } from '../config/api';
import {
  fetchAllTerritories,
  fetchSpecificTerritory,
  fetchNestedTerritories,
  fetchDataWithMultipleFilters,
} from '../services/dataService';
import { useGeoLabels } from './useRange';
import { normalizeResponse } from '../helpers/dataHelpers';

/**
 * Hook to fetch data for all territories of a level
 * @param {string} datasetId - Dataset identifier
 * @param {string} geoLevel - Geographic level
 * @param {Object} params - Additional query parameters
 * @param {Object} options - React Query options
 * @returns {Object} React Query result
 */
export const useAllTerritories = (datasetId, geoLevel, params = {}, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.data.byId(datasetId, { GEO: geoLevel, ...params }),
    queryFn: () => fetchAllTerritories(datasetId, geoLevel, params),
    enabled: Boolean(datasetId && geoLevel),
    ...options,
  });

/**
 * Hook to fetch data for a specific territory
 * @param {string} datasetId - Dataset identifier
 * @param {string} geoLevel - Geographic level
 * @param {string} geoCode - Territory code
 * @param {Object} params - Additional query parameters
 * @param {Object} options - React Query options
 * @returns {Object} React Query result
 */
export const useSpecificTerritory = (datasetId, geoLevel, geoCode, params = {}, options = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.data.byId(datasetId, { GEO: `${geoLevel}-${geoCode}`, ...params }),
    queryFn: () => fetchSpecificTerritory(datasetId, geoLevel, geoCode, params),
    enabled: Boolean(datasetId && geoLevel && geoCode),
    ...options,
  });

/**
 * Hook to fetch data for nested territories
 * @param {string} datasetId - Dataset identifier
 * @param {string} parentLevel - Parent geographic level
 * @param {string} parentCode - Parent territory code
 * @param {string} childLevel - Child geographic level
 * @param {Object} params - Additional query parameters
 * @param {Object} options - React Query options
 * @returns {Object} React Query result
 */
export const useNestedTerritories = (
  datasetId,
  parentLevel,
  parentCode,
  childLevel,
  params = {},
  options = {}
) =>
  useQuery({
    queryKey: QUERY_KEYS.data.byId(datasetId, {
      GEO: `${parentLevel}-${parentCode}*${childLevel}`,
      ...params,
    }),
    queryFn: () => fetchNestedTerritories(datasetId, parentLevel, parentCode, childLevel, params),
    enabled: Boolean(datasetId && parentLevel && parentCode && childLevel),
    ...options,
  });

/**
 * Hook to fetch data with multiple filter values
 * @param {string} datasetId - Dataset identifier
 * @param {Object} params - Query parameters (can contain arrays)
 * @param {Object} [options] - React Query options
 * @param {(bytes: number) => void} [options.onProgress] - Cumulative bytes received callback.
 *        When provided, the body is read as a stream so the caller can render a
 *        live download size. Kept out of the query key — same dataset + params
 *        share the same cache entry.
 * @returns {Object} React Query result
 */
export const useDataWithMultipleFilters = (datasetId, params = {}, options = {}) => {
  const { onProgress, ...queryOptions } = options;
  // Use a ref so changing the callback between renders doesn't invalidate the
  // queryFn identity (and therefore doesn't trigger a refetch).
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  return useQuery({
    queryKey: QUERY_KEYS.data.byId(datasetId, params),
    queryFn: () =>
      fetchDataWithMultipleFilters(datasetId, params, {
        onProgress: onProgressRef.current
          ? (bytes) => onProgressRef.current(bytes)
          : undefined,
      }),
    enabled: Boolean(datasetId && Object.keys(params).length > 0),
    ...queryOptions,
  });
};

/**
 * Hook to fetch data with enriched geographic labels
 * Combines data fetching with range/labels fetching
 * @param {string} datasetId - Dataset identifier
 * @param {string} geoLevel - Geographic level
 * @param {Object} params - Additional query parameters
 * @param {Object} options - React Query options
 * @returns {Object} React Query result with enriched data
 */
export const useAllTerritoriesWithLabels = (datasetId, geoLevel, params = {}, options = {}) => {
  const dataQuery = useAllTerritories(datasetId, geoLevel, params, options);
  const { geoLabelsMap } = useGeoLabels(datasetId);

  const enrichedData = useMemo(() => {
    if (!dataQuery.data) return null;
    return normalizeResponse(dataQuery.data, geoLabelsMap);
  }, [dataQuery.data, geoLabelsMap]);

  return {
    ...dataQuery,
    data: enrichedData || dataQuery.data,
  };
};

