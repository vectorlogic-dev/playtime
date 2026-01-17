import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import { GalaxyMap } from './pages/GalaxyMap';
import { SystemView } from './pages/SystemView';
import { Empire } from './pages/Empire';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/galaxy/:galaxyId" element={<GalaxyMap />} />
        <Route path="/galaxy/:galaxyId/system/:systemId" element={<SystemView />} />
        <Route path="/galaxy/:galaxyId/empire" element={<Empire />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
