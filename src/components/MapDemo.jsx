import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router';
import { Map as MapGL } from 'react-map-gl/maplibre';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useCatalogAll } from '../hooks/useCatalog';
import { useAllTerritories } from '../hooks/useData';
import { useRange } from '../hooks/useRange';
import { useGeographicDatasets } from '../hooks/useGeographicDatasets';
import { useMapQueryParams } from '../hooks/useMapQueryParams';
import { useMapData } from '../hooks/useMapData';
import { getDatasetTitle } from '../helpers/datasetHelpers';
import MapLayers from './MapLayers';
import MapLegend from './MapLegend';

// Register PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

/**
 * Map demo component
 * Displays geographic data from Melodi API on an interactive map
 * @returns {React.ReactElement} Map demo page
 */
const MapDemo = () => {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 5,
  });

  // Ensure PMTiles protocol is registered
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    console.log('PMTiles protocol registered');
    return () => maplibregl.removeProtocol('pmtiles');
  }, []);

  // Fetch and filter datasets
  const { data: allDatasets = [], isLoading: isCatalogLoading } = useCatalogAll();
  const geographicDatasets = useGeographicDatasets(allDatasets);

  // Get range data and build query params
  const { data: rangeData } = useRange(selectedDataset?.identifier, {
    enabled: Boolean(selectedDataset)
  });
  const queryParams = useMapQueryParams(rangeData);

  // Fetch geographic data
  const { data: geoData, isLoading: isDataLoading, error: dataError } = useAllTerritories(
    selectedDataset?.identifier,
    'EPCI',
    queryParams,
    { enabled: Boolean(selectedDataset) && Object.keys(queryParams).length > 0 }
  );

  // Transform data for map visualization
  const { dataLookup, colorStops } = useMapData(geoData);

  // Debug logging
  useEffect(() => {
    if (selectedDataset && Object.keys(queryParams).length > 0) {
      console.log('Query params for', selectedDataset.identifier, ':', queryParams);
    }
  }, [selectedDataset, queryParams]);

  const hasData = selectedDataset && dataLookup.size > 0 && colorStops;

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          variant="outlined"
          size="small"
        >
          Retour à l'accueil
        </Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Démonstration cartographique
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Visualisez les données géographiques de l'API Melodi sur une carte interactive
        </Typography>

        <Autocomplete
          options={geographicDatasets}
          getOptionLabel={(option) => `${getDatasetTitle(option)} (${option.identifier})`}
          value={selectedDataset}
          onChange={(event, newValue) => setSelectedDataset(newValue)}
          loading={isCatalogLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionner un jeu de données"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isCatalogLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ maxWidth: 600 }}
        />
      </Paper>

      {dataError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement des données : {dataError.message}
        </Alert>
      )}

      {isDataLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      <Paper elevation={2} sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden', minHeight: 500 }}>
        <MapGL
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          interactiveLayerIds={['epci-background', 'epci-data']}
        >
          <MapLayers
            dataLookup={dataLookup}
            colorStops={colorStops}
            hasData={hasData}
          />
        </MapGL>

        {selectedDataset && geoData && (
          <MapLegend
            dataset={selectedDataset}
            observationCount={geoData.observations?.length || 0}
            minValue={colorStops?.min || 0}
            maxValue={colorStops?.max || 100}
          />
        )}
      </Paper>
    </Container>
  );
};

export default MapDemo;
