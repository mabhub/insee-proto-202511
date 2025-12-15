import { Source, Layer } from 'react-map-gl/maplibre';

/**
 * Interpolate color based on a ratio value
 * Creates a smooth gradient between predefined color stops
 *
 * @param {number} ratio - Value between 0 and 1 representing position in color scale
 * @returns {string} RGB color string (e.g., 'rgb(254, 229, 217)')
 *
 * @example
 * interpolateColor(0) // Returns 'rgb(254, 229, 217)' (light pink)
 * interpolateColor(0.5) // Returns 'rgb(252, 146, 114)' (medium orange)
 * interpolateColor(1) // Returns 'rgb(165, 15, 21)' (dark red)
 */
const interpolateColor = (ratio) => {
  const colors = [
    { stop: 0, color: [254, 229, 217] },    // #fee5d9
    { stop: 0.25, color: [252, 187, 161] }, // #fcbba1
    { stop: 0.5, color: [128, 146, 250] },  // #fc9272
    { stop: 0.75, color: [251, 106, 74] },  // #fb6a4a
    { stop: 1, color: [165, 15, 21] }       // #a50f15
  ];

  for (let i = 0; i < colors.length - 1; i++) {
    if (ratio >= colors[i].stop && ratio <= colors[i + 1].stop) {
      const localRatio = (ratio - colors[i].stop) / (colors[i + 1].stop - colors[i].stop);
      const r = Math.round(colors[i].color[0] + (colors[i + 1].color[0] - colors[i].color[0]) * localRatio);
      const g = Math.round(colors[i].color[1] + (colors[i + 1].color[1] - colors[i].color[1]) * localRatio);
      const b = Math.round(colors[i].color[2] + (colors[i + 1].color[2] - colors[i].color[2]) * localRatio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return '#a50f15';
};

/**
 * Map layers component
 * Renders EPCI boundaries and data visualization
 */
const MapLayers = ({ dataLookup, colorStops, hasData }) => (
  <Source
    id="epci-source"
    type="vector"
    url="pmtiles:///epci.pmtiles"
  >
    {/* Background layer */}
    <Layer
      id="epci-background"
      source-layer="epci_contour"
      type="fill"
      paint={{
        'fill-color': '#e0e0e0',
        'fill-opacity': 0.3,
      }}
    />

    {/* Data layer with colors */}
    {hasData && (
      <Layer
        id="epci-data"
        source-layer="epci_contour"
        type="fill"
        paint={{
          'fill-color': [
            'match',
            ['to-string', ['get', 'GEO']],
            // Generate flat array of [code, color] pairs for MapLibre match expression
            // Example output: ['200070712', 'rgb(254, 229, 217)', '243500774', 'rgb(252, 187, 161)', ...]
            ...Array.from(dataLookup.entries()).flatMap(([code, data]) => {
              const ratio = (data.value - colorStops.min) / (colorStops.max - colorStops.min);
              return [code, interpolateColor(ratio)];
            }),
            '#e0e0e0'
          ],
          'fill-opacity': 0.7,
        }}
      />
    )}

    {/* Border layer */}
    <Layer
      id="epci-borders"
      source-layer="epci_contour"
      type="line"
      paint={{
        'line-color': '#666',
        'line-width': 0.5,
        'line-opacity': 0.5,
      }}
    />
  </Source>
);

MapLayers.displayName = 'MapLayers';

export default MapLayers;
