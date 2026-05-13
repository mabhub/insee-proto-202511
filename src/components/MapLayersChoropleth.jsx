// src/components/MapLayersChoropleth.jsx
// Layer cartographique : choroplèthe sur un niveau géographique du PMTiles geo_2025.
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { buildStepExpression } from '../helpers/colorHelpers';

/**
 * Mapping entre niveau géographique logique et nom de couche dans geo_2025.pmtiles.
 * Limité aux niveaux disponibles dans le PMTiles courant (REG absent).
 */
export const GEO_LEVEL_TO_SOURCE_LAYER = {
  COM: 'com_contour',
  EPCI: 'epci_contour',
  DEP: 'dep_contour',
};

/** Identifiant de la couche cliquable pour `interactiveLayerIds`. */
export const buildFillDataLayerId = (geoLevel) =>
  `${(geoLevel ?? 'DEP').toLowerCase()}-fill-data`;

/**
 * Affiche les contours d'un niveau géographique colorés selon 5 classes,
 * via le PMTiles geo_2025.pmtiles.
 *
 * Trois layers superposées :
 * - <level>-fill-bg : fond gris neutre (visible pour les entités sans donnée)
 * - <level>-fill-data : coloration selon les données
 * - <level>-borders : contours fins pour séparer les entités
 *
 * @param {Object} props
 * @param {Map<string, {value: number, label: string}>} props.dataLookup - Valeurs par code court
 * @param {{min: number, max: number}|null} props.ratioStops - Bornes min/max pour les classes
 * @param {'COM'|'EPCI'|'DEP'} [props.geoLevel='DEP'] - Niveau géographique à afficher
 * @param {'linear'|'log'} [props.scale='linear'] - Échelle de découpage des classes
 */
const MapLayersChoropleth = ({ dataLookup, ratioStops, geoLevel = 'DEP', scale = 'linear' }) => {
  const effectiveLevel = GEO_LEVEL_TO_SOURCE_LAYER[geoLevel] ? geoLevel : 'DEP';
  const sourceLayer = GEO_LEVEL_TO_SOURCE_LAYER[effectiveLevel];
  const prefix = effectiveLevel.toLowerCase();

  // Expression MapLibre `match` : attribue une couleur de classe à chaque code GEO
  const fillColorExpression = useMemo(
    () => buildStepExpression(dataLookup, ratioStops, { scale }),
    [dataLookup, ratioStops, scale]
  );

  return (
    <Source id="geo-2025-source" type="vector" url="pmtiles:///geo_2025.pmtiles" attribution="Insee">
      {/* Fond neutre — s'affiche pour les entités sans donnée */}
      <Layer
        id={`${prefix}-fill-bg`}
        source-layer={sourceLayer}
        type="fill"
        paint={{ 'fill-color': '#e0e0e0', 'fill-opacity': 0.3 }}
      />
      {/* Coloration choroplèthe selon les données */}
      <Layer
        id={`${prefix}-fill-data`}
        source-layer={sourceLayer}
        type="fill"
        paint={{ 'fill-color': fillColorExpression, 'fill-opacity': 0.75 }}
      />
      {/* Contours fins */}
      <Layer
        id={`${prefix}-borders`}
        source-layer={sourceLayer}
        type="line"
        paint={{ 'line-color': '#666', 'line-width': 0.8, 'line-opacity': 0.6 }}
      />
    </Source>
  );
};

MapLayersChoropleth.displayName = 'MapLayersChoropleth';
export default MapLayersChoropleth;
