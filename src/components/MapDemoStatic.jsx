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

import { useStaticDatasets, useStaticMapData } from '../hooks/useStaticData';
import MapLayers from './MapLayers';
import MapLegend from './MapLegend';

// Register PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

/**
 * Static map demo component
 * Displays fictional geographic data on an interactive map
 * Demonstrates selector/map interaction without API dependency
 * @returns {React.ReactElement} Static map demo page
 */
const MapDemoStatic = () => {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 4,
  });

  // Ensure PMTiles protocol is registered
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => maplibregl.removeProtocol('pmtiles');
  }, []);

  // Fetch static datasets
  const { data: staticData, isLoading, error } = useStaticDatasets();
  const datasets = staticData?.datasets || [];

  // Transform data for map visualization
  const { dataLookup, colorStops } = useStaticMapData(selectedDataset);

  const hasData = selectedDataset && dataLookup.size > 0 && colorStops;

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          variant="contained"
        >
          Retour à l'accueil
        </Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Démonstration cartographique (données statiques)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Visualisez des données fictives sur une carte interactive. Cette démo illustre le
          fonctionnement de l'interaction entre le sélecteur et le rendu cartographique.
        </Typography>

        <Autocomplete
          options={datasets}
          getOptionLabel={(option) => option.title}
          value={selectedDataset}
          onChange={(event, newValue) => setSelectedDataset(newValue)}
          loading={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionner un indicateur"
              variant="outlined"
              helperText={selectedDataset?.description}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ maxWidth: 600 }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement des données : {error.message}
        </Alert>
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

        {selectedDataset && hasData && (
          <MapLegend
            dataset={selectedDataset}
            observationCount={dataLookup.size}
            minValue={colorStops.min}
            maxValue={colorStops.max}
          />
        )}
      </Paper>
    </Container>
  );
};

export default MapDemoStatic;
