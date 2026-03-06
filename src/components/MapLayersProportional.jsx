// src/components/MapLayersProportional.jsx
// Layer cartographique : ronds proportionnels sur les centroïdes de département
import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

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
  // Construit l'expression MapLibre `match` pour le rayon des cercles
  // Rayon entre MIN (petite valeur) et MAX (grande valeur) px
  const radiusExpression = useMemo(() => {
    if (!dataLookup.size || !colorStops) return 4;

    const MIN = 4, MAX = 40;
    return [
      'match',
      ['to-string', ['get', 'GEO']], // Propriété GEO dans PMTiles = code court "01"
      ...Array.from(dataLookup.entries()).flatMap(([code, { value }]) => {
        const ratio = (value - colorStops.min) / (colorStops.max - colorStops.min);
        return [code, MIN + ratio * (MAX - MIN)];
      }),
      MIN, // Rayon par défaut pour les territoires sans donnée
    ];
  }, [dataLookup, colorStops]);

  return (
    <Source id="dep-centroid-source" type="vector" url="pmtiles:///geo_2025.pmtiles" attribution="Insee">
      <Layer
        id="dep-circles"
        source-layer="dep_centroid"
        type="circle"
        paint={{
          'circle-radius': radiusExpression,
          'circle-color': '#e63946',
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        }}
      />
    </Source>
  );
};

MapLayersProportional.displayName = 'MapLayersProportional';
export default MapLayersProportional;
