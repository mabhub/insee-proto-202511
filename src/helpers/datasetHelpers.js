/**
 * Helper functions for dataset data manipulation
 */

/**
 * Extract text from multilingual field
 * @param {Array} field - Array of objects with lang and content
 * @param {string} preferredLang - Preferred language (default: 'fr')
 * @returns {string} Extracted text or empty string
 */
export const getMultilingualText = (field, preferredLang = 'fr') => {
  if (!field || !Array.isArray(field) || field.length === 0) {
    return '';
  }

  // Try preferred language
  const preferred = field.find((item) => item.lang === preferredLang);
  if (preferred?.content) {
    return preferred.content;
  }

  // Fallback to first available
  return field[0]?.content || '';
};

/**
 * Get dataset title
 * @param {Object} dataset - Dataset object
 * @returns {string} Dataset title
 */
export const getDatasetTitle = (dataset) => {
  if (!dataset) return '';
  return getMultilingualText(dataset.title) || dataset.identifier || 'Sans titre';
};

/**
 * Get dataset description
 * @param {Object} dataset - Dataset object
 * @returns {string} Dataset description
 */
export const getDatasetDescription = (dataset) => {
  if (!dataset) return '';
  return getMultilingualText(dataset.description) || '';
};

/**
 * Get dataset subtitle
 * @param {Object} dataset - Dataset object
 * @returns {string} Dataset subtitle
 */
export const getDatasetSubtitle = (dataset) => {
  if (!dataset) return '';
  return getMultilingualText(dataset.subtitle) || '';
};
