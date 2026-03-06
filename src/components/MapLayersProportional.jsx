// src/components/MapLayersProportional.jsx
// Layer cartographique : ronds proportionnels sur les centroïdes de département
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { buildProportionalCircleExpression } from '../helpers/colorHelpers';

/**
 * Affiche des cercles dont le rayon est proportionnel à la valeur de la donnée,
 * via la couche "dep_centroid" du fichier PMTiles geo_2025.pmtiles.
 *
 * Choix technique : l'expression `match` MapLibre est calculée côté JS à partir
 * de dataLookup (Map code → valeur), car les valeurs métier ne sont pas dans
 * les propriétés PMTiles. Le code court (ex. "01") sert de clé de jointure entre
 * la Map JS et la propriété GEO des features PMTiles.
 *
 * @param {Map<string, {value: number, label: string}>} dataLookup - Données par code département
 * @param {{min: number, max: number}|null} colorStops - Bornes pour la normalisation des rayons
 */
const MapLayersProportional = ({ dataLookup, colorStops }) => {
  const radiusExpression = useMemo(
    () => buildProportionalCircleExpression(dataLookup, colorStops),
    [dataLookup, colorStops]
  );

  return (
    <Source id="dep-centroid-source" type="vector" url="pmtiles:///geo_2025.pmtiles" attribution="Insee">
      <Layer
        id="dep-circles"
        source-layer="dep_centroid"
        type="circle"
        paint={{
          'circle-radius': radiusExpression,
          'circle-color': '#268DFF', // B4 Insee
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        }}
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

MapLayersProportional.displayName = 'MapLayersProportional';
export default MapLayersProportional;
