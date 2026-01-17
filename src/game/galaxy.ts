// Galaxy generation utilities
// TODO: Server-side galaxy generation. This is client-side for MVP.

import type { System, Lane } from '@/lib/types';

export interface GalaxyConfig {
  systemCount: number;
  minConnections: number;
  maxConnections: number;
  width: number;
  height: number;
}

const DEFAULT_CONFIG: GalaxyConfig = {
  systemCount: 20,
  minConnections: 2,
  maxConnections: 4,
  width: 2000,
  height: 2000,
};

export function generateSystems(
  galaxyId: string,
  config: GalaxyConfig = DEFAULT_CONFIG
): Omit<System, 'created_at'>[] {
  const systems: Omit<System, 'created_at'>[] = [];
  const starTypes: System['star_type'][] = [
    'red_dwarf',
    'yellow',
    'blue_giant',
    'white_dwarf',
  ];

  for (let i = 0; i < config.systemCount; i++) {
    systems.push({
      id: crypto.randomUUID(),
      galaxy_id: galaxyId,
      name: `System ${i + 1}`,
      x: Math.random() * config.width,
      y: Math.random() * config.height,
      star_type: starTypes[Math.floor(Math.random() * starTypes.length)],
      planets: Math.floor(Math.random() * 5) + 1,
    });
  }

  return systems;
}

export function generateLanes(
  galaxyId: string,
  systems: System[],
  config: GalaxyConfig = DEFAULT_CONFIG
): Omit<Lane, 'created_at'>[] {
  const lanes: Omit<Lane, 'created_at'>[] = [];
  const connections = new Map<string, Set<string>>();

  // Initialize connections map
  systems.forEach((sys) => {
    connections.set(sys.id, new Set());
  });

  // Connect each system to at least minConnections neighbors
  systems.forEach((system, idx) => {
    const currentConnections = connections.get(system.id)!;
    
    // Find nearest neighbors
    const neighbors = systems
      .map((s, i) => ({ system: s, idx: i, distance: getDistance(system, s) }))
      .filter((n) => n.idx !== idx)
      .sort((a, b) => a.distance - b.distance);

    // Connect to nearest neighbors up to maxConnections
    const targetConnections = Math.min(
      config.maxConnections,
      Math.max(config.minConnections, neighbors.length)
    );

    for (const neighbor of neighbors) {
      if (currentConnections.size >= targetConnections) break;
      
      const neighborConnections = connections.get(neighbor.system.id)!;
      
      // Avoid duplicate connections
      if (!currentConnections.has(neighbor.system.id)) {
        currentConnections.add(neighbor.system.id);
        neighborConnections.add(system.id);

        const distance = getDistance(system, neighbor.system);
        lanes.push({
          id: crypto.randomUUID(),
          galaxy_id: galaxyId,
          from_system_id: system.id,
          to_system_id: neighbor.system.id,
          distance,
        });
      }
    }
  });

  return lanes;
}

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Find adjacent systems (connected by a lane)
export function getAdjacentSystems(
  systemId: string,
  lanes: Lane[]
): string[] {
  return lanes
    .filter((lane) => lane.from_system_id === systemId || lane.to_system_id === systemId)
    .map((lane) =>
      lane.from_system_id === systemId ? lane.to_system_id : lane.from_system_id
    );
}

// Check if two systems are connected
export function areSystemsConnected(
  fromSystemId: string,
  toSystemId: string,
  lanes: Lane[]
): boolean {
  return lanes.some(
    (lane) =>
      (lane.from_system_id === fromSystemId && lane.to_system_id === toSystemId) ||
      (lane.from_system_id === toSystemId && lane.to_system_id === fromSystemId)
  );
}
