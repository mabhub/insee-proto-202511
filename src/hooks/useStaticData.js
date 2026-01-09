import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Hook to fetch static demo data from JSON file
 * Loads fictional geographic datasets from /demo-data.json for demonstration purposes
 * 
 * @returns {Object} React Query result object
 * @returns {Object} returns.data - Parsed JSON containing datasets array
 * @returns {Array} returns.data.datasets - Array of dataset objects with id, title, description, data
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error} returns.error - Error object if fetch failed
 * 
 * @example
 * const { data, isLoading, error } = useStaticDatasets();
 * const datasets = data?.datasets || [];
 * // datasets: [{id: 'population-fictive', title: '...', data: {...}}]
 */
export const useStaticDatasets = () => {
  return useQuery({
    queryKey: ['static-datasets'],
    queryFn: async () => {
      const response = await fetch('/demo-data.json');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      return response.json();
    },
    staleTime: Infinity, // Static data never becomes stale
  });
};

/**
 * Hook to fetch static demo data from JSON file
 * Loads fictional geographic datasets from /demo-data.json for demonstration purposes
 * 
 * @returns {Object} React Query result object
 * @returns {Object} returns.data - Parsed JSON containing datasets array
 * @returns {Array} returns.data.datasets - Array of dataset objects with id, title, description, data
 * @returns {boolean} returns.isLoading - Loading state
 * @returns {Error} returns.error - Error object if fetch failed
 * 
 * @example
 * const { data, isLoading, error } = useStaticDatasets();
 * const datasets = data?.datasets || [];
 * // datasets: [{id: 'population-fictive', title: '...', data: {...}}]
 */
export const useStaticIndicators = () => {
  return useQuery({
    queryKey: ['static-indicators'],
    queryFn: async () => {
      const response = await fetch('/indicators.json');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      return response.json();
    },
    staleTime: Infinity, // Static data never becomes stale
  });
};


export const useStaticGeographies = () => {
  return useQuery({
    queryKey: ['static-geographies'],
    queryFn: async () => {
      const response = await fetch('/geography.json');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      return response.json();
    },
    staleTime: Infinity, // Static data never becomes stale
  });
};

/**
 * Hook to transform static dataset into map-ready format
 * Converts static data object into Map structure with color stops for visualization
 * 
 * @param {Object} selectedDataset - Selected dataset from static data
 * @param {string} selectedDataset.id - Dataset identifier
 * @param {string} selectedDataset.title - Dataset display title
 * @param {Object} selectedDataset.data - Object mapping EPCI codes to values
 * @returns {Object} Transformed data for map visualization
 * @returns {Map} returns.dataLookup - Map of code → {value, label, geoObject}
 * @returns {Object|null} returns.colorStops - {min, max} values for color interpolation
 * 
 * @example
 * const selectedDataset = {id: 'population-fictive', data: {'200070712': 145230, ...}};
 * const { dataLookup, colorStops } = useStaticMapData(selectedDataset);
 * // dataLookup: Map('200070712' → {value: 145230, label: 'EPCI 200070712', geoObject: 'EPCI'})
 */
export const useStaticMapData = (selectedDataset) => {
  const dataLookup = useMemo(() => {
    if (!selectedDataset?.data) return new Map();

    const lookup = new Map();
    Object.entries(selectedDataset.data).forEach(([code, value]) => {
      lookup.set(code, {
        value: Number(value),
        label: `EPCI ${code}`,
        geoObject: 'EPCI',
      });
    });

    return lookup;
  }, [selectedDataset]);

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
