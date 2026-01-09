/**
 * Helper functions for dataset data manipulation
 */

/**
 * Get indicator title
 * @param {Object} dataset - Dataset object
 * @returns {string} Dataset title
 */
export const getGeographyTitle = (geography) => {
  if (!geography) return '';
  return geography.title || geography.id || geography;
};
