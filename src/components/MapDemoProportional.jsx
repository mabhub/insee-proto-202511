// src/components/MapDemoProportional.jsx
// Page de démonstration : ronds proportionnels par département (population 2022)
import { useState, useRef } from 'react';
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
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyles, MapSelectorControl } from 'carte-facile';
import 'carte-facile/carte-facile.css';

import { useAllTerritories } from '../hooks/useData';
import { useMapData } from '../hooks/useMapData';
import { usePMTilesProtocol } from '../hooks/usePMTilesProtocol';
import { buildPopupInfo } from '../helpers/mapHelpers';
import MapLayersProportional from './MapLayersProportional';
import MapLegendProportional from './MapLegendProportional';

// Paramètres de requête API Melodi : population totale 2022 par département
const DATASET_ID = 'DS_RP_POPULATION_PRINC';
const QUERY_PARAMS = { SEX: '_T', AGE: '_T', TIME_PERIOD: '2022' };

/**
 * Contrôle de sélection du fond de carte (carte-facile IGN)
 * Doit être rendu à l'intérieur de <MapGL> pour accéder au contexte de carte.
 */
function MyMapSelectorControl() {
  useControl(() => new MapSelectorControl());
  return null;
}

/**
 * Page de démonstration : ronds proportionnels
 * Affiche la population 2022 par département sous forme de cercles dont
 * le rayon est proportionnel à la valeur. Données issues de l'API Melodi.
 *
 * @returns {React.ReactElement}
 */
const MapDemoProportional = () => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 4.5,
  });

  usePMTilesProtocol();

  // Récupération des données via TanStack Query
  const { data: geoData, isLoading, error } = useAllTerritories(DATASET_ID, 'DEP', QUERY_PARAMS);

  // Transformation en Map code → {value, label} + calcul min/max
  const { dataLookup, colorStops } = useMapData(geoData);

  const handleClick = (evt) => {
    const features = mapRef.current?.queryRenderedFeatures(evt.point, {
      layers: ['dep-circles'],
    });
    setPopupInfo(buildPopupInfo(features, dataLookup, evt.lngLat));
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
            Ronds proportionnels
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Population en 2022 par département — données{' '}
            <Link href="https://api.insee.fr/melodi" target="_blank">API Melodi</Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jeu de données : <code>DS_RP_POPULATION_PRINC</code>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filtre : SEX=_T, AGE=_T, TIME_PERIOD=2022, GEO=DEP
          </Typography>

          {isLoading && <CircularProgress sx={{ mt: 2 }} />}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>}
          {colorStops && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {dataLookup.size} départements chargés
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
            interactiveLayerIds={['dep-circles']}
          >
            <MyMapSelectorControl />
            <GeolocateControl />
            <FullscreenControl />
            <NavigationControl />
            <ScaleControl />
            <MapLayersProportional dataLookup={dataLookup} colorStops={colorStops} />

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
                  {popupInfo.value?.toLocaleString('fr-FR')} habitants
                </Typography>
              </Popup>
            )}
          </MapGL>

          {colorStops && (
            <MapLegendProportional
              minValue={colorStops.min}
              maxValue={colorStops.max}
              territoryCount={dataLookup.size}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default MapDemoProportional;
