import React from 'react';

interface SystemPanelProps {
  system: {
    id: string;
    name: string;
    x: number;
    y: number;
    ownerStatus: 'Owned' | 'Neutral';
    yields: {
      energy: number;
      minerals: number;
      science: number;
    };
  };
}

export function SystemPanel({ system }: SystemPanelProps) {
  return (
    <div
      style={{
        height: '100%',
        background: '#141414',
        borderLeft: '1px solid #333',
        padding: '20px',
        color: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>{system.name}</h2>

      <div style={{ marginBottom: '12px', color: '#bbb' }}>
        Coordinates: ({Math.round(system.x)}, {Math.round(system.y)})
      </div>
      <div style={{ marginBottom: '16px', color: '#bbb' }}>
        Owner: {system.ownerStatus}
      </div>

      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Base Yields</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#ddd' }}>
          <div>Energy: {system.yields.energy}</div>
          <div>Minerals: {system.yields.minerals}</div>
          <div>Science: {system.yields.science}</div>
        </div>
      </div>
    </div>
  );
}
