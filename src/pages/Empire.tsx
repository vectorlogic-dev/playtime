import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Empire view - placeholder for future expansion
export function Empire() {
  const { galaxyId } = useParams<{ galaxyId: string }>();
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
        <h1>Empire View</h1>
        <p>Galaxy: {galaxyId}</p>
        <p>TODO: Implement empire management interface</p>
        <button onClick={() => navigate(`/galaxy/${galaxyId}`)}>
          Back to Galaxy Map
        </button>
      </div>
    </div>
  );
}
