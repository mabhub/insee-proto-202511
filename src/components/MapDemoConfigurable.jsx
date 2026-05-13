// src/components/MapDemoConfigurable.jsx
// Configurable choropleth demo page: indicator + geographic level + class scale.
import { useState, useRef, useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  FullscreenControl,
  GeolocateControl,
  Map as MapGL,
  NavigationControl,
  Popup,
  ScaleControl,
  useControl,
} from 'react-map-gl/maplibre';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, MapSelectorControl } from 'carte-facile';
import 'carte-facile/carte-facile.css';

import { useDataWithMultipleFilters } from '../hooks/useData';
import { usePMTilesProtocol } from '../hooks/usePMTilesProtocol';
import { computeIndicator } from '../helpers/indicatorCompute';
import { buildPopupInfo } from '../helpers/mapHelpers';
import MapLayersChoropleth, {
  GEO_LEVEL_TO_SOURCE_LAYER,
  buildFillDataLayerId,
} from './MapLayersChoropleth';
import MapLegendChoropleth from './MapLegendChoropleth';
import indicators from '../config/indicators.json';

const GEO_LEVELS = Object.keys(GEO_LEVEL_TO_SOURCE_LAYER); // ['COM', 'EPCI', 'DEP']
const GEO_LEVEL_LABELS = {
  COM: 'Commune',
  EPCI: 'EPCI',
  DEP: 'Département',
};

/**
 * Carte-facile basemap selector control, rendered inside <MapGL>.
 * @returns {null} Side-effect only
 */
const MyMapSelectorControl = () => {
  useControl(() => new MapSelectorControl());
  return null;
};

/**
 * Configurable choropleth demo page.
 *
 * Lets the user pick an indicator from src/config/indicators.json, a geographic
 * level (COM, EPCI, DEP) and a class scale (linear or log). The map shows the
 * computed indicator coloured in 5 classes.
 *
 * @returns {React.ReactElement} Page content
 */
const MapDemoConfigurable = () => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 4.5,
  });
  const [indicatorId, setIndicatorId] = useState(indicators[0]?.id);
  const [geoLevel, setGeoLevel] = useState('DEP');
  const [scale, setScale] = useState('linear');

  usePMTilesProtocol();

  const indicator = useMemo(
    () => indicators.find((ind) => ind.id === indicatorId) ?? indicators[0],
    [indicatorId],
  );

  // Build query params: indicator filter + GEO level.
  // COM (~35k communes) needs maxResult=100000 to bypass the default 10k cap,
  // otherwise multi-value filters (e.g. AGE=_T+Y_LT20) return only one of the
  // values and the ratio cannot be computed.
  const queryParams = useMemo(() => {
    const base = { ...indicator.filter, GEO: geoLevel };
    if (geoLevel === 'COM') base.maxResult = 100000;
    return base;
  }, [indicator, geoLevel]);

  const { data: rawData, isLoading, error } = useDataWithMultipleFilters(
    indicator.datasetId,
    queryParams,
  );

  const { lookup, stops } = useMemo(
    () => computeIndicator(rawData?.observations, indicator.formula),
    [rawData, indicator],
  );

  const fillDataLayerId = buildFillDataLayerId(geoLevel);

  const handleClick = (evt) => {
    const features = mapRef.current?.queryRenderedFeatures(evt.point, {
      layers: [fillDataLayerId],
    });
    setPopupInfo(buildPopupInfo(features, lookup, evt.lngLat));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/" startIcon={<HomeIcon />} variant="contained">
          Retour à l'accueil
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
        {/* Description and controls panel */}
        <Paper elevation={1} sx={{ flex: 1, maxWidth: '35%', p: 3, m: 1, overflowY: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Choroplèthe configurable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Indicateur et niveau géographique au choix —{' '}
            <Link href="https://api.insee.fr/melodi" target="_blank">API Melodi</Link>
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="indicator-label">Indicateur</InputLabel>
              <Select
                labelId="indicator-label"
                label="Indicateur"
                value={indicator.id}
                onChange={(e) => setIndicatorId(e.target.value)}
              >
                {indicators.map((ind) => (
                  <MenuItem key={ind.id} value={ind.id}>
                    {ind.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="geo-level-label">Niveau géographique</InputLabel>
              <Select
                labelId="geo-level-label"
                label="Niveau géographique"
                value={geoLevel}
                onChange={(e) => setGeoLevel(e.target.value)}
              >
                {GEO_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {GEO_LEVEL_LABELS[level]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Échelle des classes
              </Typography>
              <ToggleButtonGroup
                value={scale}
                exclusive
                size="small"
                onChange={(_, next) => next && setScale(next)}
              >
                <ToggleButton value="linear">Linéaire</ToggleButton>
                <ToggleButton value="log" disabled={!(stops && stops.min > 0)}>
                  Log
                </ToggleButton>
              </ToggleButtonGroup>
              {scale === 'log' && stops && stops.min <= 0 && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                  Log indisponible (valeurs ≤ 0)
                </Typography>
              )}
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Jeu de données : <code>{indicator.datasetId}</code>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Niveau : <code>{geoLevel}</code>
          </Typography>

          {isLoading && <CircularProgress sx={{ mt: 2 }} />}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>}
          {stops && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {lookup.size} entités — {stops.min.toFixed(2)} {indicator.unit} à{' '}
              {stops.max.toFixed(2)} {indicator.unit}
            </Typography>
          )}
        </Paper>

        {/* Map container */}
        <Paper elevation={2} sx={{ flex: 2, position: 'relative', overflow: 'hidden', minHeight: 500, m: 1 }}>
          <MapGL
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            ref={mapRef}
            onClick={handleClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle={mapStyles.desaturated}
            interactiveLayerIds={[fillDataLayerId]}
          >
            <MyMapSelectorControl />
            <GeolocateControl />
            <FullscreenControl />
            <NavigationControl />
            <ScaleControl />
            <MapLayersChoropleth
              key={geoLevel}
              dataLookup={lookup}
              ratioStops={stops}
              geoLevel={geoLevel}
              scale={scale}
            />

            {popupInfo && (
              <Popup
                longitude={popupInfo.longitude}
                latitude={popupInfo.latitude}
                closeButton
                closeOnClick={false}
                onClose={() => setPopupInfo(null)}
                anchor="bottom"
                style={{ color: '#333' }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {popupInfo.label}
                </Typography>
                <Typography variant="body2">
                  {popupInfo.value?.toFixed(2)} {indicator.unit}
                </Typography>
              </Popup>
            )}
          </MapGL>

          {stops && (
            <MapLegendChoropleth
              minValue={stops.min}
              maxValue={stops.max}
              title={indicator.title}
              unit={indicator.unit}
              scale={scale}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MapDemoConfigurable;
