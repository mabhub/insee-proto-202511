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

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dataset-selector" element={<DatasetSelector />} />
      <Route path="/api-demo" element={<ApiDemo />} />
      <Route path="/map-demo" element={<MapDemo />} />
      <Route path="/map-demo-static" element={<MapDemoStatic />} />
    </Routes>
  </BrowserRouter>
);

export default App;
