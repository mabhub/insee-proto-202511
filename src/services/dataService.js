import { normalizeResponse } from '../helpers/dataHelpers';
import { buildDataUrl } from '../helpers/melodiParams';

/**
 * Fetch data from Melodi API with optional query parameters
 * @param {string} datasetId - Dataset identifier
 * @param {Object} params - Query parameters (e.g., {GEO: 'EPCI', SEX: '_T', AGE: '_T'})
 * @returns {Promise<Object>} API response data
 */
const fetchData = async (datasetId, params = {}) => {
  const response = await fetch(buildDataUrl(datasetId, params));

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const data = await response.json();
  return normalizeResponse(data);
};

/**
 * Fetch data for all territories of a given level
 * Pattern: GEO=<niveau>
 * @param {string} datasetId - Dataset identifier
 * @param {string} geoLevel - Geographic level (EPCI, DEP, REG, COM)
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Promise<Object>} API response data
 */
export const fetchAllTerritories = (datasetId, geoLevel, additionalParams = {}) =>
  fetchData(datasetId, {
    GEO: geoLevel,
    ...additionalParams,
  });

/**
 * Fetch data for a specific territory
 * Pattern: GEO=<niveau>-<code>
 * @param {string} datasetId - Dataset identifier
 * @param {string} geoLevel - Geographic level (EPCI, DEP, REG, COM)
 * @param {string} geoCode - Territory code
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Promise<Object>} API response data
 */
export const fetchSpecificTerritory = (datasetId, geoLevel, geoCode, additionalParams = {}) =>
  fetchData(datasetId, {
    GEO: `${geoLevel}-${geoCode}`,
    ...additionalParams,
  });

/**
 * Fetch data for nested territories
 * Pattern: GEO=<parent>*<enfant>
 * @param {string} datasetId - Dataset identifier
 * @param {string} parentLevel - Parent geographic level
 * @param {string} parentCode - Parent territory code
 * @param {string} childLevel - Child geographic level
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Promise<Object>} API response data
 */
export const fetchNestedTerritories = (
  datasetId,
  parentLevel,
  parentCode,
  childLevel,
  additionalParams = {}
) =>
  fetchData(datasetId, {
    GEO: `${parentLevel}-${parentCode}*${childLevel}`,
    ...additionalParams,
  });

/**
 * Read a response body as text while reporting incremental byte counts.
 * Falls back to response.text() if the body is not a stream.
 * @param {Response} response - Fetch response
 * @param {(bytes: number) => void} onProgress - Called with cumulative bytes received
 * @returns {Promise<string>} Decoded body text
 */
const readBodyWithProgress = async (response, onProgress) => {
  if (!response.body?.getReader) return response.text();
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    onProgress(received);
  }
  text += decoder.decode();
  return text;
};

/**
 * Fetch data for multiple filter values (e.g., multiple ages).
 * @param {string} datasetId - Dataset identifier
 * @param {Object} params - Query parameters with array values
 * @param {Object} [options]
 * @param {() => void} [options.onResponseStart] - Called when the server's response
 *        headers have arrived, before any body byte is read. Lets the caller
 *        distinguish "waiting for server" from "downloading".
 * @param {(bytes: number) => void} [options.onProgress] - Cumulative bytes received callback.
 *        When provided, the response body is read as a stream so the caller can
 *        surface download progress. Adds a small overhead vs response.json().
 * @returns {Promise<Object>} API response data
 */
export const fetchDataWithMultipleFilters = async (
  datasetId,
  params = {},
  { onResponseStart, onProgress } = {},
) => {
  const response = await fetch(buildDataUrl(datasetId, params));

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  onResponseStart?.();

  const data = onProgress
    ? JSON.parse(await readBodyWithProgress(response, onProgress))
    : await response.json();
  return normalizeResponse(data);
};
