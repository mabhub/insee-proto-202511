import { API_CONFIG } from '../config/api';

/**
 * Fetch range (dimensions and members with labels) for a dataset
 * @param {string} datasetId - Dataset identifier
 * @returns {Promise<Object>} Range data with all dimensions and their members
 */
export const fetchRange = async (datasetId) => {
  const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.range.byId(datasetId)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch range: ${response.statusText}`);
  }
  
  return response.json();
};

/**
 * Build a map of GEO IDs to labels from range data
 * @param {Object} rangeData - Range data from API
 * @returns {Map<string, string>} Map of GEO ID to label
 */
export const buildGeoLabelsMap = (rangeData) => {
  const geoLabels = new Map();
  
  if (!rangeData?.range) return geoLabels;
  
  // Find GEO dimension
  const geoDimension = rangeData.range.find(dim => dim.concept?.code === 'GEO');
  
  if (!geoDimension?.values) return geoLabels;
  
  // Build map: id -> label
  geoDimension.values.forEach(value => {
    if (value.id && value.label?.fr) {
      geoLabels.set(value.id, value.label.fr);
    }
  });
  
  return geoLabels;
};
