import { Source, Layer } from 'react-map-gl/maplibre';

/**
 * Map layers component
 * Renders EPCI boundaries and data visualization
 */
const MapLayersCarteFacile = ({ lineOpacity, lineColor = '#666' }) => (
  <Source
    id="geo-source"
    type="vector"
    url="pmtiles:///epci.pmtiles"
    attribution='Insee'
  >
    {/* Border layer */}
    <Layer
      id="epci-borders"
      source-layer="epci_contour"
      type="line"
      paint={{
        'line-color': lineColor,
        'line-width': 1,
        'line-opacity': lineOpacity,
      }}
    />
    {/* Fill layer */}
    <Layer
      id="epci-fill"
      source-layer="epci_contour"
      type="fill"
      paint={{
        'fill-opacity': 0,
      }}
    />
  </Source>
);

MapLayersCarteFacile.displayName = 'MapLayersCarteFacile';

export default MapLayersCarteFacile;
