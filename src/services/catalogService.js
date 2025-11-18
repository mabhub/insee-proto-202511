import { API_CONFIG } from '../config/api';

/**
 * Fetch catalog data with error handling
 * @param {string} endpoint - API endpoint to call
 * @returns {Promise<any>} API response data
 */
const fetchCatalog = async (endpoint) => {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get all datasets from catalog
 * @returns {Promise<Array>} List of all datasets
 */
export const getAllDatasets = async () => fetchCatalog(API_CONFIG.endpoints.catalog.all);

/**
 * Get a specific dataset by ID
 * @param {string} id - Dataset identifier
 * @returns {Promise<Object>} Dataset details
 */
export const getDatasetById = async (id) => fetchCatalog(API_CONFIG.endpoints.catalog.byId(id));

/**
 * Get all dataset IDs
 * @returns {Promise<Object>} Object containing dataset IDs
 */
export const getDatasetIds = async () => fetchCatalog(API_CONFIG.endpoints.catalog.ids);

/**
 * Get range (dimensions and modalities) for a dataset
 * @param {string} id - Dataset identifier
 * @returns {Promise<Object>} Range data
 */
export const getDatasetRange = async (id) => fetchCatalog(API_CONFIG.endpoints.range.byId(id));
