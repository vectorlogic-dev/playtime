// Database table types (Supabase)

export interface Galaxy {
  id: string;
  name: string;
  created_at: string;
  tick: number;
  status: 'lobby' | 'active' | 'paused' | 'finished';
}

export interface System {
  id: string;
  galaxy_id: string;
  name: string;
  x: number;
  y: number;
  star_type: 'red_dwarf' | 'yellow' | 'blue_giant' | 'white_dwarf';
  planets: number;
  created_at: string;
}

export interface Lane {
  id: string;
  galaxy_id: string;
  from_system_id: string;
  to_system_id: string;
  distance: number;
  created_at: string;
}

export interface Ownership {
  id: string;
  system_id: string;
  player_id: string;
  captured_at: string;
}

export interface Fleet {
  id: string;
  player_id: string;
  system_id: string;
  name: string;
  ships: number;
  created_at: string;
}

export interface PlayerState {
  id: string;
  player_id: string;
  galaxy_id: string;
  empire_name: string;
  color: string; // hex color
  ready: boolean;
  created_at: string;
}

export type OrderType = 'MOVE_FLEET';

export interface Order {
  id: string;
  player_id: string;
  galaxy_id: string;
  order_type: OrderType;
  tick: number;
  payload: Record<string, unknown>; // JSON payload
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
}

// MOVE_FLEET order payload
export interface MoveFleetOrderPayload {
  fleet_id: string;
  to_system_id: string;
}

// UI/Game state types

export interface GameState {
  galaxy: Galaxy | null;
  systems: System[];
  lanes: Lane[];
  ownership: Ownership[];
  fleets: Fleet[];
  playerStates: PlayerState[];
  currentPlayer: PlayerState | null;
  selectedFleet: Fleet | null;
  selectedSystem: System | null;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
