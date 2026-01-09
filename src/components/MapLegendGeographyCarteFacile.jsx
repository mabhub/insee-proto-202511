import { Paper, Typography, Box } from '@mui/material';

/**
 * Map legend component
 * Displays dataset information and color scale gradient in fixed position overlay
 * 
 * @param {Object} props - Component props
 * @param {Object} props.dataset - Selected dataset object
 * @param {string} props.dataset.title - Dataset display title
 * @param {number} props.observationCount - Number of territories displayed
 * @param {number} props.minValue - Minimum value in dataset (light color)
 * @param {number} props.maxValue - Maximum value in dataset (dark color)
 * @returns {React.ReactElement} Legend overlay component
 * 
 * @example
 * <MapLegend
 *   dataset={selectedDataset}
 *   observationCount={1250}
 *   minValue={3915}
 *   maxValue={7115576}
 * />
 */
const MapLegendGeographyCarteFacile = ({}) => (
  <Paper
    elevation={1}
    sx={{
      position: 'absolute',
      bottom: 16,
      // pour centrer la popup
      transform: "translateX(-50%)",
      left: '50%',
      p: 1,
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
      France par Niveau géographique (XXXX)
    </Typography>
  </Paper>
);

MapLegendGeographyCarteFacile.displayName = 'MapLegendGeographyCarteFacile';

export default MapLegendGeographyCarteFacile;
