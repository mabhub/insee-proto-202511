// src/components/MapDemoConfigurable.jsx
// Configurable choropleth demo page: indicator + geographic level + class scale.
import { useState, useRef, useMemo, useEffect } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, MapSelectorControl } from 'carte-facile';
import 'carte-facile/carte-facile.css';

import { useDataWithMultipleFilters } from '../hooks/useData';
import { usePMTilesProtocol } from '../hooks/usePMTilesProtocol';
import { computeIndicator } from '../helpers/indicatorCompute';
import { normalizeFilter } from '../helpers/melodiParams';
import { buildPopupInfo } from '../helpers/mapHelpers';
import MapLayersChoropleth, {
  GEO_LEVEL_TO_SOURCE_LAYER,
  buildFillDataLayerId,
} from './MapLayersChoropleth';
import MapLegendChoropleth from './MapLegendChoropleth';
import MapLayersProportional from './MapLayersProportional';
import MapLegendProportional from './MapLegendProportional';
import indicators from '../config/indicators.json';

// Couche cible du clic en mode ronds proportionnels (cf. MapLayersProportional).
const BUBBLE_LAYER_ID = 'dep-circles';

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

const PHASE_STEPS = [
  { key: 'requesting', label: 'Attente de la réponse du serveur' },
  { key: 'downloading', label: 'Téléchargement des données' },
  { key: 'computing', label: 'Calcul de l’indicateur' },
  { key: 'rendering', label: 'Rendu de la carte' },
];

// PHASE_ORDER must include the terminal 'ready' phase used to hide the panel.
const PHASE_ORDER = [...PHASE_STEPS.map((s) => s.key), 'ready'];

/**
 * Format a byte count into a human-readable string (Ko / Mo, French locale).
 * @param {number} bytes - Cumulative byte count
 * @returns {string} Formatted size, e.g. "4,2 Mo"
 */
const formatBytes = (bytes) => {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
  }
  return `${(bytes / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Ko`;
};

/**
 * Vertical list of load steps shown while the page is fetching/computing/rendering.
 * Each step is either pending, in progress (spinner), or done (check icon).
 *
 * @param {Object} props
 * @param {'requesting'|'downloading'|'computing'|'rendering'|'ready'} props.phase - Current phase
 * @param {number} props.observationsCount - Number of observations received (annotates the compute step)
 * @param {number} props.downloadedBytes - Cumulative bytes received (annotates the download step)
 * @returns {React.ReactElement} Step list
 */
const LoadProgress = ({ phase, observationsCount, downloadedBytes }) => {
  const currentIndex = PHASE_ORDER.indexOf(phase);
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {PHASE_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = step.key === phase;
        const annotation =
          step.key === 'downloading' && downloadedBytes > 0
            ? ` — ${formatBytes(downloadedBytes)}`
            : step.key === 'computing' && observationsCount > 0
              ? ` (${observationsCount.toLocaleString('fr-FR')} obs)`
              : '';
        return (
          <Box key={step.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isDone ? (
              <CheckCircleIcon fontSize="small" color="success" />
            ) : isActive ? (
              <CircularProgress size={16} />
            ) : (
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid', borderColor: 'divider' }} />
            )}
            <Typography
              variant="body2"
              color={isActive ? 'text.primary' : isDone ? 'text.secondary' : 'text.disabled'}
            >
              {step.label}{annotation}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
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

  // Représentation pilotée par la config (indicators.json) : choroplèthe
  // (surfaces colorées, multi-niveaux) ou ronds proportionnels (valeur absolue).
  const isBubble = indicator.display === 'bubble';

  // Les ronds proportionnels s'appuient sur la couche PMTiles "dep_centroid",
  // disponible au seul niveau département : en mode bubble on force donc DEP
  // (le sélecteur de niveau est masqué côté UI).
  const effectiveGeoLevel = isBubble ? 'DEP' : geoLevel;

  // Build query params: indicator filter + GEO level.
  // COM (~35k communes) needs maxResult=100000 to bypass the default 10k cap,
  // otherwise multi-value filters (e.g. AGE=_T+Y_LT20) return only one of the
  // values and the ratio cannot be computed.
  const queryParams = useMemo(() => {
    const base = { ...normalizeFilter(indicator.filter), GEO: effectiveGeoLevel };
    if (effectiveGeoLevel === 'COM') base.maxResult = 100000;
    return base;
  }, [indicator, effectiveGeoLevel]);

  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [responseStarted, setResponseStarted] = useState(false);

  const { data: rawData, isLoading, error } = useDataWithMultipleFilters(
    indicator.datasetId,
    queryParams,
    {
      onResponseStart: () => setResponseStarted(true),
      onProgress: setDownloadedBytes,
    },
  );

  const observationsCount = rawData?.observations?.length ?? 0;

  const { lookup, stops } = useMemo(
    () => computeIndicator(rawData?.observations, indicator.formula),
    [rawData, indicator],
  );

  // Load phase used to surface progress in the side panel:
  //   requesting → downloading → computing → rendering → ready
  //
  // `requesting` covers the wait between firing the request and receiving the
  // first response bytes (server TTFB). `downloading` starts on the first
  // chunk read from the body stream.
  const [phase, setPhase] = useState('ready');

  useEffect(() => {
    if (isLoading) {
      setPhase('requesting');
      setResponseStarted(false);
      setDownloadedBytes(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && responseStarted) setPhase('downloading');
  }, [isLoading, responseStarted]);

  useEffect(() => {
    if (!isLoading && rawData) setPhase('computing');
  }, [isLoading, rawData]);

  useEffect(() => {
    if (phase !== 'computing') return;
    // The useMemo has run synchronously by the time this effect fires;
    // hand off to the next paint so 'computing' is actually visible.
    const id = requestAnimationFrame(() => setPhase('rendering'));
    return () => cancelAnimationFrame(id);
  }, [phase, lookup]);

  useEffect(() => {
    if (phase !== 'rendering') return;

    let cancelled = false;
    let rafId = null;
    let timeoutId = null;
    let detach = null;

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      setPhase('ready');
    };

    const attach = () => {
      const map = mapRef.current?.getMap?.();
      if (!map) {
        // Ref not ready yet — try again on the next frame.
        rafId = requestAnimationFrame(attach);
        return;
      }
      // If the map already settled before we got here, finish immediately.
      // isStyleLoaded() + !isMoving() is the same predicate MapLibre uses
      // before emitting 'idle'.
      if (map.isStyleLoaded() && !map.isMoving()) {
        finish();
        return;
      }
      const handleIdle = () => finish();
      map.on('idle', handleIdle);
      detach = () => map.off('idle', handleIdle);
    };

    attach();

    // Safety net: if 'idle' never fires (e.g. continuous animation, missed
    // event), don't leave the user stuck on "Rendu de la carte" forever.
    timeoutId = setTimeout(finish, 1500);

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (detach) detach();
    };
  }, [phase, lookup, effectiveGeoLevel, scale]);

  const fillDataLayerId = buildFillDataLayerId(effectiveGeoLevel);
  // Couche cliquable selon la représentation courante.
  const interactiveLayerId = isBubble ? BUBBLE_LAYER_ID : fillDataLayerId;

  const handleClick = (evt) => {
    const features = mapRef.current?.queryRenderedFeatures(evt.point, {
      layers: [interactiveLayerId],
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
            Cartographie sur API
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

            {/* Niveau géographique : choroplèthe seulement (les ronds
                proportionnels sont figés au niveau département). */}
            {!isBubble && (
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
            )}
            {isBubble && (
              <Typography variant="caption" color="text.secondary">
                Ronds proportionnels — niveau département.
              </Typography>
            )}
          </Stack>

            {/* Échelle des classes : pertinente uniquement pour la choroplèthe. */}
            {!isBubble && (
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
            )}

          {phase !== 'ready' && (
            <LoadProgress
              phase={phase}
              observationsCount={observationsCount}
              downloadedBytes={downloadedBytes}
            />
          )}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>}
          {stops && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {lookup.size} entités — {stops.min.toFixed(2)} {indicator.unit} à{' '}
              {stops.max.toFixed(2)} {indicator.unit}
            </Typography>
          )}
            <Typography variant="body2">          
              <Link 
                href={`https://catalogue-donnees.insee.fr/fr/explorateur/${indicator.datasetId}`}
                target="_blank"
                >
                🚀 Explorer le jeu de données de la carte ({indicator.datasetId})
              </Link>
            </Typography>
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
            interactiveLayerIds={[interactiveLayerId]}
          >
            <MyMapSelectorControl />
            <GeolocateControl />
            <FullscreenControl />
            <NavigationControl />
            <ScaleControl />
            {isBubble ? (
              <MapLayersProportional dataLookup={lookup} colorStops={stops} />
            ) : (
              <MapLayersChoropleth
                key={effectiveGeoLevel}
                dataLookup={lookup}
                ratioStops={stops}
                geoLevel={effectiveGeoLevel}
                scale={scale}
              />
            )}

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
                  {isBubble
                    ? `${popupInfo.value?.toLocaleString('fr-FR')} ${indicator.unit}`
                    : `${popupInfo.value?.toFixed(2)} ${indicator.unit}`}
                </Typography>
              </Popup>
            )}
          </MapGL>

          {stops && isBubble && (
            <MapLegendProportional
              minValue={stops.min}
              maxValue={stops.max}
              territoryCount={lookup.size}
            />
          )}
          {stops && !isBubble && (
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
