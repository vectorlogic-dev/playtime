// Local mock tick function for development
// TODO: Replace with server-side tick processing

import type { GameState, Fleet, Order, System } from '@/lib/types';
import { areSystemsConnected } from './galaxy';

/**
 * Simulates one game tick on the client state.
 * This is a dev-only function that processes pending orders locally.
 * 
 * In production, this should be handled by a server-side function:
 * - Database function or edge function
 * - Processes all pending orders for the current tick
 * - Updates fleet positions, ownership, etc.
 * - Advances tick counter
 */
export function simulateTick(gameState: GameState): GameState {
  const updatedState = { ...gameState };
  
  if (!updatedState.galaxy) {
    console.warn('Cannot simulate tick: no galaxy loaded');
    return updatedState;
  }

  // TODO: Fetch pending orders from database
  // For now, we simulate processing any orders that would be in the current tick
  
  // Find fleets that should move (based on hypothetical pending orders)
  // In real implementation, this would query the orders table for:
  // - galaxy_id = current galaxy
  // - tick = current tick
  // - status = 'pending'
  // - order_type = 'MOVE_FLEET'

  // Example: Process MOVE_FLEET orders
  updatedState.fleets = updatedState.fleets.map((fleet) => {
    // TODO: Check if there's a pending MOVE_FLEET order for this fleet
    // For mock, we don't actually process anything since orders aren't in state
    
    return fleet;
  });

  // TODO: Update ownership based on fleet movements
  // TODO: Handle combat if fleets meet
  // TODO: Update galaxy tick counter
  // updatedState.galaxy.tick += 1;

  console.log('[MOCK TICK] Simulated tick for galaxy:', updatedState.galaxy.id);
  console.log('[MOCK TICK] TODO: Implement full server-side tick processing');
  
  return updatedState;
}

/**
 * Helper to check if a fleet can move to a system in the current state
 */
export function canFleetMove(
  fleet: Fleet,
  targetSystem: System,
  gameState: GameState
): { canMove: boolean; error?: string } {
  // Check if systems are connected
  const isConnected = areSystemsConnected(
    fleet.system_id,
    targetSystem.id,
    gameState.lanes
  );

  if (!isConnected) {
    return { canMove: false, error: 'Systems are not connected by a lane' };
  }

  return { canMove: true };
}
