import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router';

import Home from './components/Home';
import DatasetSelector from './components/DatasetSelector';
import ApiDemo from './components/ApiDemo';
import MapDemo from './components/MapDemo';
import MapDemoStatic from './components/MapDemoStatic';
import MapDemoIgnCarteFacile from './components/MapDemoIgnCarteFacile';
import MapDemoProportional from './components/MapDemoProportional';
import MapDemoChoropleth from './components/MapDemoChoropleth';
import MapDemoConfigurable from './components/MapDemoConfigurable';
import MelodiHealthcheck from './components/MelodiHealthcheck';
import MelodiBenchmark from './components/MelodiBenchmark';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dataset-selector" element={<DatasetSelector />} />
      <Route path="/api-demo" element={<ApiDemo />} />
      <Route path="/map-demo" element={<MapDemo />} />
      <Route path="/map-demo-static" element={<MapDemoStatic />} />
      <Route path="/map-demo-ign-cartefacile" element={<MapDemoIgnCarteFacile />} />
      <Route path="/map-demo-proportional" element={<MapDemoProportional />} />
      <Route path="/map-demo-choropleth" element={<MapDemoChoropleth />} />
      <Route path="/map-demo-configurable" element={<MapDemoConfigurable />} />
      <Route path="/melodi-healthcheck" element={<MelodiHealthcheck />} />
      <Route path="/melodi-benchmark" element={<MelodiBenchmark />} />
    </Routes>
  </BrowserRouter>
);

export default App;
