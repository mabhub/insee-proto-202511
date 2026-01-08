import { Source, Layer } from 'react-map-gl/maplibre';

/**
 * Map layers component
 * Renders EPCI boundaries and data visualization
 */
const MapLayersCarteFacile = ({ dataLookup, colorStops, hasData }) => (
  <Source
    id="geo-source"
    type="vector"
    url="pmtiles:///epci.pmtiles"
  >
    {/* Border layer */}
    <Layer
      id="epci-borders"
      source-layer="epci_contour"
      type="line"
      paint={{
        'line-color': '#666',
        'line-width': 1,
        'line-opacity': 1,
      }}
    />
  </Source>
);

MapLayersCarteFacile.displayName = 'MapLayersCarteFacile';

export default MapLayersCarteFacile;
