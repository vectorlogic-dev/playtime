import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// SystemView is shown via SystemPanel overlay in GalaxyMap
// This page is a placeholder if we want a dedicated route
export function SystemView() {
  const { galaxyId, systemId } = useParams<{ galaxyId: string; systemId: string }>();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        padding: '40px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>System View</h1>
        <p>Galaxy: {galaxyId}</p>
        <p>System: {systemId}</p>
        <button onClick={() => navigate(`/galaxy/${galaxyId}`)}>
          Back to Galaxy Map
        </button>
      </div>
    </div>
  );
}
