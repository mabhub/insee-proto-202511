import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router';

import Home from './components/Home';
import DatasetSelector from './components/DatasetSelector';
import ApiDemo from './components/ApiDemo';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dataset-selector" element={<DatasetSelector />} />
      <Route path="/api-demo" element={<ApiDemo />} />
    </Routes>
  </BrowserRouter>
);

export default App;
