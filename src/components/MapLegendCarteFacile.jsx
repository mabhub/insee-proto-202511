import { Paper, Typography, Box } from '@mui/material';
import { getIndicatorTitle } from '../helpers/indicatorHelpers';

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
const MapLegendCarteFacile = ({ indicator }) => (
  <Paper
    elevation={3}
    sx={{
      position: 'absolute',
      top: 16,
      right: 16,
      p: 2,
      maxWidth: 300,
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
      {getIndicatorTitle(indicator)}
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      ... territoires
    </Typography>
  </Paper>
);

MapLegendCarteFacile.displayName = 'MapLegendCarteFacile';

export default MapLegendCarteFacile;
