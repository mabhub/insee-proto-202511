import { Source, Layer } from 'react-map-gl/maplibre';

/**
 * Map layers component
 * Renders EPCI boundaries and data visualization
 */
const MapLayersCarteFacile = ({ lineOpacity, lineColor = '#666' }) => (
  <Source
    id="geo-source"
    type="vector"
    url="pmtiles:///geo_2025.pmtiles"
    attribution='Insee'
  >
    {/* Border layer */}
    <Layer
      id="com-borders"
      source-layer="com_contour"
      type="line"
      paint={{
        'line-color': '#413e3e',
        'line-width': 1,
        'line-opacity': lineOpacity,
      }}
    />
    {/* Fill layer */}
    <Layer
      id="com-fill"
      source-layer="com_contour"
      type="fill"
      paint={{
        'fill-opacity': 0,
      }}
    />
    {/* Border layer */}
    <Layer
      id="epci-borders"
      source-layer="epci_contour"
      type="line"
      paint={{
        'line-color': '#1e21ce',
        'line-width': 2,
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
    {/* Border layer */}
    <Layer
      id="dep-borders"
      source-layer="dep_contour"
      type="line"
      paint={{
        'line-color': '#9e2222',
        'line-width': 3,
        'line-opacity': lineOpacity,
      }}
    />
    {/* Fill layer */}
    <Layer
      id="dep-fill"
      source-layer="dep_contour"
      type="fill"
      paint={{
        'fill-opacity': 0,
      }}
    />
    {/* Border layer */}
    <Layer
      id="france-borders"
      source-layer="france_contour"
      type="line"
      paint={{
        'line-color': '#0da100',
        'line-width': 4,
        'line-opacity': lineOpacity,
      }}
    />
    {/* Fill layer */}
    <Layer
      id="france-fill"
      source-layer="france_contour"
      type="fill"
      paint={{
        'fill-opacity': 0,
      }}
    />
  </Source>
);

MapLayersCarteFacile.displayName = 'MapLayersCarteFacile';

export default MapLayersCarteFacile;
