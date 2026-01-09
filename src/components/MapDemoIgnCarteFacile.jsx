import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router';
import { FullscreenControl, GeolocateControl, Map as MapGL, NavigationControl, Popup, ScaleControl, useControl } from 'react-map-gl/maplibre';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Autocomplete,
  TextField,
  CircularProgress,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useStaticIndicators, useStaticMapData } from '../hooks/useStaticData';
import MapLayersCarteFacile from './MapLayersCarteFacile';
import MapLegendCarteFacile from './MapLegendCarteFacile';

// ign carte facile
import { mapStyles } from 'carte-facile';
import 'carte-facile/carte-facile.css';
import { MapSelectorControl } from 'carte-facile';
import MapLegendGeographyCarteFacile from './MapLegendGeographyCarteFacile';

// Register PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

function MyMapSelectorControl() {
  useControl(() => new MapSelectorControl());

  return null;
}

/**
 * Static map demo component
 * Displays fictional geographic data on an interactive map
 * Demonstrates selector/map interaction without API dependency
 * @returns {React.ReactElement} Static map demo page
 */
const MapDemoIgnCarteFacile = () => {
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [selectedOpacity, setSelectedOpacity] = useState(0.8);
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 46.603354,
    zoom: 4.5,
  });

  // Ensure PMTiles protocol is registered
  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => maplibregl.removeProtocol('pmtiles');
  }, []);

  // Fetch static indicators
  const { data: staticData, isLoading, error } = useStaticIndicators();
  const indicators = staticData?.indicators || [];

  const handleClick = (evt) => {
    if (!mapRef.current) return;

    // Récupère les features sous le curseur
    const features = mapRef.current.queryRenderedFeatures(evt.point, {
      layers: ['epci-fill'],
    });

    if (features.length > 0) {
      // Affiche la popup avec l'ID de la feature
      setPopupInfo({
        longitude: evt.lngLat.lng,
        latitude: evt.lngLat.lat,
        properties: features[0].properties
      });
    } else {
      // Ferme la popup si on clique ailleurs
      setPopupInfo(null);
    }
  };

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

      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
        <Paper elevation={1} sx={{ flex: 1, maxWidth: '40%', p: 3, m: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Carte réactive maplibre
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Prototype expérimentation réactivité et utilisation de <Link href="https://fab-geocommuns.github.io/carte-facile-site/fr/" target='_blank'>carte facile de l'IGN</Link>
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
          <Autocomplete
            options={indicators}
            getOptionLabel={(option) => option.title}
            groupBy={(option) => option.theme}
            value={selectedIndicator}
            onChange={(event, newValue) => setSelectedIndicator(newValue)}
            loading={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sélectionner un indicateur"
                variant="outlined"
                //helperText={selectedIndicator?.title}
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
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Niveau géographique</InputLabel>
            <Select
              defaultValue="epci"
              label="Niveau géographique"
            >
              <MenuItem value={"epci"}>Intercommunalité</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Opacité des contours</InputLabel>
            <Slider
              value={selectedOpacity} 
              onChange={(event, newValue) => setSelectedOpacity(newValue)}
              step={0.1}
              marks
              min={0}
              max={1}
            />
          </FormControl>
        </Paper>

        <Paper elevation={2} sx={{ flex: 2, position: 'relative', overflow: 'hidden', minHeight: 500, m: 1 }}>
          <MapGL
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            ref={mapRef}
            onClick={handleClick}
            style={{ width: '100%', height: '100%' }}
            mapStyle={mapStyles.desaturated}
            //TODO ne fonctionne pas, à faire à la main?
            mapOptions={{ hash: true }}
          >
            <MyMapSelectorControl />
            <GeolocateControl />
            <FullscreenControl />
            <NavigationControl />
            <ScaleControl />
            <MapLayersCarteFacile
              lineOpacity={selectedOpacity}
            />
             {/* Popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setPopupInfo(null)}
          anchor="bottom"
          style={{
            color: '#333', // Texte foncé
        }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom >
            {popupInfo.properties.GEO_LIB}
          </Typography>
        </Popup>
      )}
          </MapGL>

          {selectedIndicator && (
            <MapLegendCarteFacile
              indicator={selectedIndicator}
            />
          )}

            <MapLegendGeographyCarteFacile/>
        </Paper>
      </Box>
    </Container>
  );
};

export default MapDemoIgnCarteFacile;
