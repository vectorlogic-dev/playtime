// Order processing utilities

import type { Order, MoveFleetOrderPayload, System, Lane, Fleet } from '@/lib/types';
import { areSystemsConnected } from './galaxy';

export function validateMoveFleetOrder(
  order: Order,
  fleet: Fleet | null,
  targetSystem: System | null,
  lanes: Lane[]
): { valid: boolean; error?: string } {
  if (!fleet) {
    return { valid: false, error: 'Fleet not found' };
  }

  if (!targetSystem) {
    return { valid: false, error: 'Target system not found' };
  }

  const payload = order.payload as MoveFleetOrderPayload;
  
  if (payload.fleet_id !== fleet.id) {
    return { valid: false, error: 'Fleet ID mismatch' };
  }

  if (payload.to_system_id !== targetSystem.id) {
    return { valid: false, error: 'Target system ID mismatch' };
  }

  // Check if systems are connected by a lane
  if (!areSystemsConnected(fleet.system_id, targetSystem.id, lanes)) {
    return { valid: false, error: 'Systems are not connected by a lane' };
  }

  return { valid: true };
}

export function createMoveFleetOrder(
  playerId: string,
  galaxyId: string,
  currentTick: number,
  fleetId: string,
  toSystemId: string
): Omit<Order, 'id' | 'created_at'> {
  return {
    player_id: playerId,
    galaxy_id: galaxyId,
    order_type: 'MOVE_FLEET',
    tick: currentTick,
    payload: {
      fleet_id: fleetId,
      to_system_id: toSystemId,
    } as MoveFleetOrderPayload,
    status: 'pending',
  };
}
