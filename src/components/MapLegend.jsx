import { Paper, Typography, Box } from '@mui/material';
import { getDatasetTitle } from '../helpers/datasetHelpers';

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
const MapLegend = ({ dataset, observationCount, minValue, maxValue }) => (
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
      {getDatasetTitle(dataset)}
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {observationCount} territoires (EPCI)
    </Typography>
    <Box sx={{ mt: 2 }}>
      <Typography variant="caption" display="block" color="text.secondary">
        Échelle de valeurs
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            bgcolor: '#fee5d9',
            border: '1px solid #ccc',
          }}
        />
        <Typography variant="caption">{minValue.toLocaleString('fr-FR')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            bgcolor: '#a50f15',
            border: '1px solid #ccc',
          }}
        />
        <Typography variant="caption">{maxValue.toLocaleString('fr-FR')}</Typography>
      </Box>
    </Box>
  </Paper>
);

MapLegend.displayName = 'MapLegend';

export default MapLegend;
