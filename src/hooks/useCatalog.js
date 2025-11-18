import { useQuery } from '@tanstack/react-query';
import { getAllDatasets, getDatasetById, getDatasetIds, getDatasetRange } from '../services/catalogService';
import { QUERY_KEYS } from '../config/api';

/**
 * Hook to fetch all datasets from catalog
 * @returns {Object} Query result with datasets data, loading, and error states
 */
export const useCatalogAll = () => useQuery({
  queryKey: QUERY_KEYS.catalog.all,
  queryFn: getAllDatasets,
});

/**
 * Hook to fetch a specific dataset by ID
 * @param {string} id - Dataset identifier
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with dataset data, loading, and error states
 */
export const useCatalogById = (id, options = {}) => useQuery({
  queryKey: QUERY_KEYS.catalog.byId(id),
  queryFn: () => getDatasetById(id),
  enabled: !!id && (options.enabled !== false),
  ...options,
});

/**
 * Hook to fetch all dataset IDs
 * @returns {Object} Query result with dataset IDs, loading, and error states
 */
export const useCatalogIds = () => useQuery({
  queryKey: QUERY_KEYS.catalog.ids,
  queryFn: getDatasetIds,
});

/**
 * Hook to fetch range data for a dataset
 * @param {string} id - Dataset identifier
 * @param {Object} options - Additional query options
 * @returns {Object} Query result with range data, loading, and error states
 */
export const useDatasetRange = (id, options = {}) => useQuery({
  queryKey: QUERY_KEYS.range.byId(id),
  queryFn: () => getDatasetRange(id),
  enabled: !!id && (options.enabled !== false),
  ...options,
});
