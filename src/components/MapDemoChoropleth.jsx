// src/components/MapDemoChoropleth.jsx
// Page de démonstration : choroplèthe part des 80+ par département (2022)
import { useState, useEffect, useRef, useMemo } from 'react';
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
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, MapSelectorControl } from 'carte-facile';
import 'carte-facile/carte-facile.css';

import { useDataWithMultipleFilters } from '../hooks/useData';
import MapLayersChoropleth from './MapLayersChoropleth';
import MapLegendChoropleth from './MapLegendChoropleth';

// Une seule requête avec AGE en tableau : récupère total (_T) et 80+ (Y_GE80) en une fois
const DATASET_ID = 'DS_RP_POPULATION_PRINC';
const QUERY_PARAMS = { SEX: '_T', AGE: ['_T', 'Y_GE80'], TIME_PERIOD: '2022', GEO: 'DEP' };

/**
 * Contrôle de sélection du fond de carte (carte-facile IGN).
 * Doit être rendu à l'intérieur de <MapGL> pour accéder au contexte de carte.
 */
function MyMapSelectorControl() {
  useControl(() => new MapSelectorControl());
  return null;
}

/**
 * Page de démonstration : choroplèthe
 * Affiche la part de population âgée de 80 ans et plus en 2022 par département,
 * colorée en 5 classes d'égale amplitude. Données issues de l'API Melodi.
 *
 * @returns {React.ReactElement}
 */
const MapDemoChoropleth = () => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 4.5,
  });

  // Enregistrement du protocole PMTiles avec cleanup pour éviter les conflits
  // si plusieurs pages cartographiques sont montées/démontées
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => maplibregl.removeProtocol('pmtiles');
  }, []);

  // Une seule requête pour AGE=_T et AGE=Y_GE80
  const { data: rawData, isLoading, error } = useDataWithMultipleFilters(DATASET_ID, QUERY_PARAMS);

  /**
   * Calcul du ratio 80+ / total à partir d'une seule réponse multi-AGE.
   *
   * normalizeObservation garantit :
   *   obs.GEO      = code court "56" (extrait de "2025-DEP-56")
   *   obs.AGE      = code classe d'âge (spreadé depuis obs.dimensions)
   *   obs.OBS_VALUE = valeur numérique (depuis measures.OBS_VALUE_NIVEAU.value)
   *   obs.GEO_LIB  = libellé du département
   */
  const { ratioLookup, ratioStops } = useMemo(() => {
    if (!rawData?.observations) return { ratioLookup: new Map(), ratioStops: null };

    const totals = new Map();
    const elders = new Map();

    rawData.observations.forEach(obs => {
      if (obs.AGE === '_T')     totals.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
      if (obs.AGE === 'Y_GE80') elders.set(obs.GEO, { value: obs.OBS_VALUE, label: obs.GEO_LIB });
    });

    const ratioLookup = new Map();
    totals.forEach(({ value: tot, label }, code) => {
      const elder = elders.get(code);
      if (elder && tot > 0) {
        // Ratio en % avec 2 décimales
        ratioLookup.set(code, {
          value: +((elder.value / tot) * 100).toFixed(2),
          label,
        });
      }
    });

    const values = [...ratioLookup.values()].map(d => d.value);
    const ratioStops = ratioLookup.size
      ? { min: Math.min(...values), max: Math.max(...values) }
      : null;

    return { ratioLookup, ratioStops };
  }, [rawData]);

  /**
   * Au clic sur la carte, interroge les features de la layer de remplissage.
   * La propriété GEO dans PMTiles est le code court (ex. "56").
   */
  const handleClick = (evt) => {
    const features = mapRef.current?.queryRenderedFeatures(evt.point, {
      layers: ['dep-fill-data'],
    });
    if (features?.length > 0) {
      const props = features[0].properties;
      const code = props.GEO;
      const entry = ratioLookup.get(code);
      setPopupInfo({
        longitude: evt.lngLat.lng,
        latitude: evt.lngLat.lat,
        label: entry?.label || props.GEO_LIB || code,
        value: entry?.value,
      });
    } else {
      setPopupInfo(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/" startIcon={<HomeIcon />} variant="contained">
          Retour à l'accueil
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
        {/* Panneau de description */}
        <Paper elevation={1} sx={{ flex: 1, maxWidth: '35%', p: 3, m: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Choroplèthe
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Part de la population âgée de 80 ans et plus en 2022 par département —{' '}
            <Link href="https://api.insee.fr/melodi" target="_blank">API Melodi</Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jeu de données : <code>DS_RP_POPULATION_PRINC</code>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filtre : SEX=_T, AGE=_T+Y_GE80, TIME_PERIOD=2022, GEO=DEP
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ratio = population 80+ / population totale × 100
          </Typography>

          {isLoading && <CircularProgress sx={{ mt: 2 }} />}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>}
          {ratioStops && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {ratioLookup.size} départements — {ratioStops.min.toFixed(2)} % à {ratioStops.max.toFixed(2)} %
            </Typography>
          )}
        </Paper>

        {/* Conteneur carte */}
        <Paper elevation={2} sx={{ flex: 2, position: 'relative', overflow: 'hidden', minHeight: 500, m: 1 }}>
          <MapGL
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            ref={mapRef}
            onClick={handleClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle={mapStyles.desaturated}
            interactiveLayerIds={['dep-fill-data']}
          >
            <MyMapSelectorControl />
            <GeolocateControl />
            <FullscreenControl />
            <NavigationControl />
            <ScaleControl />
            <MapLayersChoropleth dataLookup={ratioLookup} ratioStops={ratioStops} />

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
                <Typography variant="subtitle2" fontWeight="bold">{popupInfo.label}</Typography>
                <Typography variant="body2">
                  {popupInfo.value?.toFixed(2)} % de 80 ans et plus
                </Typography>
              </Popup>
            )}
          </MapGL>

          {ratioStops && (
            <MapLegendChoropleth minValue={ratioStops.min} maxValue={ratioStops.max} />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MapDemoChoropleth;
