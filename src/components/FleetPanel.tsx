import React from 'react';
import type { Fleet, System } from '@/lib/types';

interface FleetPanelProps {
  fleets: Fleet[];
  systems: System[];
  selectedFleet: Fleet | null;
  onSelectFleet: (fleet: Fleet) => void;
  onMoveFleet: (fleetId: string, toSystemId: string) => void;
  availableTargets: string[]; // System IDs that can be moved to
}

export function FleetPanel({
  fleets,
  systems,
  selectedFleet,
  onSelectFleet,
  onMoveFleet,
  availableTargets,
}: FleetPanelProps) {
  const getSystemName = (systemId: string) => {
    return systems.find((s) => s.id === systemId)?.name || 'Unknown';
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '300px',
        maxHeight: '400px',
        background: '#1a1a1a',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '16px',
        color: '#fff',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>Fleets</h2>
      
      {fleets.length === 0 ? (
        <div style={{ color: '#888' }}>No fleets</div>
      ) : (
        <div>
          {fleets.map((fleet) => (
            <div
              key={fleet.id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                background: selectedFleet?.id === fleet.id ? '#2a4a6a' : '#2a2a2a',
                borderRadius: '4px',
                cursor: 'pointer',
                border: selectedFleet?.id === fleet.id ? '2px solid #4a9eff' : '1px solid #444',
              }}
              onClick={() => onSelectFleet(fleet)}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{fleet.name}</div>
              <div style={{ fontSize: '14px', color: '#aaa' }}>
                Location: {getSystemName(fleet.system_id)}
              </div>
              <div style={{ fontSize: '14px', color: '#aaa' }}>
                Ships: {fleet.ships}
              </div>
              
              {selectedFleet?.id === fleet.id && availableTargets.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #444' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                    Available targets:
                  </div>
                  {availableTargets.map((targetId) => (
                    <button
                      key={targetId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveFleet(fleet.id, targetId);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '4px',
                        padding: '6px',
                        background: '#3a6a9a',
                        border: '1px solid #5a8aba',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Move to {getSystemName(targetId)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
