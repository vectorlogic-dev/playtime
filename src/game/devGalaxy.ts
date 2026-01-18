import type { Galaxy, System, Lane, Ownership, PlayerState, PlayerFleet } from '@/lib/types';
import { SeededRNG } from '@/lib/rng';

const GALAXY_ID = 'dev-galaxy';
const SYSTEM_COUNT = 20;
const K_NEIGHBORS = 3;
const WIDTH = 2000;
const HEIGHT = 2000;
const SEED = 1337;
const CREATED_AT = new Date(0).toISOString();
const PLAYER_ID = 'player';
const PLAYER_COLOR = '#4a9eff';

const rng = new SeededRNG(SEED);
const starTypes: System['star_type'][] = ['red_dwarf', 'yellow', 'blue_giant', 'white_dwarf'];

const systems: System[] = Array.from({ length: SYSTEM_COUNT }, (_, index) => ({
  id: `dev-system-${index + 1}`,
  galaxy_id: GALAXY_ID,
  name: `System ${index + 1}`,
  x: rng.float(0, WIDTH),
  y: rng.float(0, HEIGHT),
  star_type: rng.choice(starTypes),
  planetCount: rng.range(0, 6),
  created_at: CREATED_AT,
  yields: {
    energy: rng.range(2, 8),
    minerals: rng.range(1, 7),
    science: rng.range(1, 6),
  },
}));

function systemDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const homeSystem = systems[0];
const ownedSystemCount = Math.min(5, systems.length);
const ownedSystems = systems
  .slice(1)
  .map((system) => ({ system, distance: systemDistance(homeSystem, system) }))
  .sort((a, b) => a.distance - b.distance)
  .slice(0, ownedSystemCount - 1)
  .map((entry) => entry.system);

const playerOwnedSystems = [homeSystem, ...ownedSystems];

// Ensure player-owned systems have at least 2 planets
playerOwnedSystems.forEach((system) => {
  if (system.planetCount < 2) {
    system.planetCount = 2;
  }
});

export const devOwnership: Ownership[] = playerOwnedSystems.map((system) => ({
  id: `dev-ownership-${system.id}`,
  system_id: system.id,
  player_id: PLAYER_ID,
  captured_at: CREATED_AT,
}));

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const lanePairs = new Map<string, Lane>();

systems.forEach((system) => {
  const neighbors = systems
    .filter((other) => other.id !== system.id)
    .map((other) => ({ system: other, distance: distance(system, other) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, K_NEIGHBORS);

  neighbors.forEach(({ system: neighbor }) => {
    const [a, b] = [system.id, neighbor.id].sort();
    const key = `${a}|${b}`;
    if (!lanePairs.has(key)) {
      lanePairs.set(key, {
        id: `dev-lane-${a}-${b}`,
        galaxy_id: GALAXY_ID,
        from_system_id: system.id,
        to_system_id: neighbor.id,
        distance: distance(system, neighbor),
        created_at: CREATED_AT,
      });
    }
  });
});

export const devGalaxy: Galaxy = {
  id: GALAXY_ID,
  name: 'Dev Galaxy',
  created_at: CREATED_AT,
  tick: 0,
  status: 'active',
};

export const devPlayerState: PlayerState = {
  id: `dev-player-${PLAYER_ID}`,
  player_id: PLAYER_ID,
  galaxy_id: GALAXY_ID,
  empire_name: 'Player',
  color: PLAYER_COLOR,
  ready: true,
  created_at: CREATED_AT,
};

export const devPlayerId = PLAYER_ID;
export const devSystems = systems;
export const devLanes = Array.from(lanePairs.values());
export const devFleets: PlayerFleet[] = [
  {
    id: 'dev-fleet-1',
    owner: 'player',
    locationSystemId: homeSystem.id,
    strength: 10,
  },
];
