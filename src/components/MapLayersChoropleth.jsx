// src/components/MapLayersChoropleth.jsx
// Layer cartographique : choroplèthe par contours de département
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { buildStepExpression } from '../helpers/colorHelpers';

/**
 * Affiche les contours de département colorés selon 5 classes d'égale amplitude,
 * via la couche "dep_contour" du fichier PMTiles geo_2025.pmtiles.
 *
 * Trois layers superposées :
 * - dep-fill-bg : fond gris neutre (visible pour les déps sans donnée)
 * - dep-fill-data : coloration selon les données (expression match calculée côté JS)
 * - dep-borders : contours fins pour séparer les départements
 *
 * @param {Map<string, {value: number, label: string}>} dataLookup - Ratios par code court
 * @param {{min: number, max: number}|null} ratioStops - Bornes min/max pour les classes
 */
const MapLayersChoropleth = ({ dataLookup, ratioStops }) => {
  // Expression MapLibre `match` : attribue une couleur de classe à chaque code GEO
  const fillColorExpression = useMemo(
    () => buildStepExpression(dataLookup, ratioStops),
    [dataLookup, ratioStops]
  );

  return (
    <Source id="dep-contour-source" type="vector" url="pmtiles:///geo_2025.pmtiles" attribution="Insee">
      {/* Fond neutre — s'affiche pour les départements sans donnée */}
      <Layer
        id="dep-fill-bg"
        source-layer="dep_contour"
        type="fill"
        paint={{ 'fill-color': '#e0e0e0', 'fill-opacity': 0.3 }}
      />
      {/* Coloration choroplèthe selon les données */}
      <Layer
        id="dep-fill-data"
        source-layer="dep_contour"
        type="fill"
        paint={{ 'fill-color': fillColorExpression, 'fill-opacity': 0.75 }}
      />
      {/* Contours fins */}
      <Layer
        id="dep-borders"
        source-layer="dep_contour"
        type="line"
        paint={{ 'line-color': '#666', 'line-width': 0.8, 'line-opacity': 0.6 }}
      />
    </Source>
  );
};

MapLayersChoropleth.displayName = 'MapLayersChoropleth';
export default MapLayersChoropleth;
