import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import { useDataWithMultipleFilters } from '../../hooks/useData';
import { useGeoLabels } from '../../hooks/useRange';
import { normalizeResponse } from '../../helpers/dataHelpers';

/**
 * Get chip color based on ratio value
 * @param {number} ratio - Ratio value
 * @returns {string} Color name
 */
const getChipColor = (ratio) => {
  if (ratio > 7) return 'error';
  if (ratio > 6) return 'warning';
  return 'default';
};

/**
 * Demo component for post-request calculations
 * Demonstrates calculating ratios from API data
 * @param {Object} props - Component props
 * @param {string} props.geoLevel - Geographic level to use for queries
 * @returns {React.ReactElement} Calculations demo component
 */
const CalculationsDemo = ({ geoLevel = 'EPCI' }) => {
  // Fetch combined data: total population + 80+ years population
  const { data: rawData, isLoading, error } = useDataWithMultipleFilters(
    'DS_RP_POPULATION_PRINC',
    {
      GEO: geoLevel,
      SEX: '_T',
      AGE: ['_T', 'Y_GE80'], // Multiple values for AGE dimension
      TIME_PERIOD: '2022',
    }
  );

  // Load geographic labels
  const { geoLabelsMap } = useGeoLabels('DS_RP_POPULATION_PRINC');

  // Enrich data with labels
  const data = useMemo(() => {
    if (!rawData) return null;
    return normalizeResponse(rawData, geoLabelsMap);
  }, [rawData, geoLabelsMap]);

  // Calculate ratio for each territory
  const calculatedData = useMemo(() => {
    if (!data?.observations) return [];

    // Group observations by GEO
    const byGeo = {};
    data.observations.forEach(obs => {
      const geoKey = `${obs.GEO_OBJECT}-${obs.GEO}`;
      if (!byGeo[geoKey]) {
        byGeo[geoKey] = {
          geoObject: obs.GEO_OBJECT,
          geo: obs.GEO,
          geoLib: obs.GEO_LIB,
          total: null,
          over80: null,
        };
      }

      if (obs.AGE === '_T') {
        byGeo[geoKey].total = Number(obs.OBS_VALUE);
      } else if (obs.AGE === 'Y_GE80') {
        byGeo[geoKey].over80 = Number(obs.OBS_VALUE);
      }
    });

    // Calculate ratios
    return Object.values(byGeo)
      .filter(item => item.total && item.over80)
      .map(item => ({
        ...item,
        ratio: (item.over80 / item.total) * 100,
      }))
      .toSorted((a, b) => b.ratio - a.ratio) // Sort by ratio descending
      .slice(0, 15); // Top 15
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            2. Calculs post-requête
          </Typography>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            2. Calculs post-requête
          </Typography>
          <Alert severity="error">
            Erreur : {error.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          2. Calculs post-requête
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Calcul de la part des personnes de 80 ans et plus par territoire (niveau: {geoLevel})
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Requête combinée optimisée
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            AGE=_T&AGE=Y_GE80&GEO={geoLevel}&TIME_PERIOD=2022
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Au lieu de 2 requêtes séparées, une seule avec plusieurs valeurs pour AGE
          </Typography>
        </Alert>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`${data?.observations?.length || 0} observations`}
            color="info"
          />
          <Chip
            label={`${calculatedData.length} EPCI calculés`}
            color="success"
          />
        </Stack>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
          Formule : (Population 80+ / Population totale) × 100
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Territoire ({geoLevel})</TableCell>
                <TableCell align="right">Pop. totale</TableCell>
                <TableCell align="right">Pop. 80+</TableCell>
                <TableCell align="right">Part (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculatedData.map((item) => (
                <TableRow key={`${item.geoObject}-${item.geo}`}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.geoLib}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.geoObject}-{item.geo}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {item.total.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell align="right">
                    {item.over80.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${item.ratio.toFixed(2)} %`}
                      color={getChipColor(item.ratio)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Affichage des 15 territoires ({geoLevel}) avec la plus forte proportion de personnes de 80 ans et plus
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CalculationsDemo;
