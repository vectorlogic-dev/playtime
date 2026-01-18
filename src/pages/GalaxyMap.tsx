import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, IS_DEV } from '@/lib/supabase';
import { MapCanvas } from '@/components/MapCanvas';
import { SystemPanel } from '@/components/SystemPanel';
import type { GameState, System, Viewport } from '@/lib/types';
import { simulateTick } from '@/game/mockTick';
import {
  devGalaxy,
  devSystems,
  devLanes,
  devOwnership,
  devPlayerId,
  devPlayerState,
  devFleets,
  type SystemYields,
} from '@/game/devGalaxy';

export function GalaxyMap() {
  const { galaxyId } = useParams<{ galaxyId: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    galaxy: null,
    systems: [],
    lanes: [],
    ownership: [],
    fleets: [],
    playerStates: [],
    currentPlayer: null,
    selectedFleet: null,
    selectedSystem: null,
  });
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!supabase) {
      setGameState({
        galaxy: devGalaxy,
        systems: devSystems,
        lanes: devLanes,
        ownership: devOwnership,
        fleets: [],
        playerStates: [devPlayerState],
        currentPlayer: devPlayerState,
        selectedFleet: null,
        selectedSystem: null,
      });
      if (devSystems.length > 0) {
        setViewport({ x: devSystems[0].x, y: devSystems[0].y, zoom: 1 });
      }
      setLoading(false);
      return;
    }

    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/');
        return;
      }
      setUser(session.user);
      loadGameData(galaxyId!, session.user.id);
    });
  }, [galaxyId, navigate]);

  const loadGameData = async (galaxyId: string, playerId: string) => {
    try {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Load galaxy
      const { data: galaxy, error: galaxyError } = await supabase
        .from('galaxies')
        .select('*')
        .eq('id', galaxyId)
        .single();

      if (galaxyError) throw galaxyError;

      // Load systems
      const { data: systems, error: systemsError } = await supabase
        .from('systems')
        .select('*')
        .eq('galaxy_id', galaxyId);

      if (systemsError) throw systemsError;

      // Load lanes
      const { data: lanes, error: lanesError } = await supabase
        .from('lanes')
        .select('*')
        .eq('galaxy_id', galaxyId);

      if (lanesError) throw lanesError;

      // Load ownership
      const { data: ownership, error: ownershipError } = await supabase
        .from('ownership')
        .select('*')
        .in('system_id', systems?.map((s) => s.id) || []);

      if (ownershipError) throw ownershipError;

      // Load fleets
      const { data: fleets, error: fleetsError } = await supabase
        .from('fleets')
        .select('*')
        .eq('player_id', playerId);

      if (fleetsError) throw fleetsError;

      // Load player states
      const { data: playerStates, error: playerStatesError } = await supabase
        .from('player_states')
        .select('*')
        .eq('galaxy_id', galaxyId);

      if (playerStatesError) throw playerStatesError;

      const currentPlayer = playerStates?.find((ps) => ps.player_id === playerId) || null;

      // Center viewport on first system
      if (systems && systems.length > 0) {
        setViewport({
          x: systems[0].x,
          y: systems[0].y,
          zoom: 1,
        });
      }

      setGameState({
        galaxy: galaxy || null,
        systems: systems || [],
        lanes: lanes || [],
        ownership: ownership || [],
        fleets: fleets || [],
        playerStates: playerStates || [],
        currentPlayer,
        selectedFleet: null,
        selectedSystem: null,
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading game data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSystemSelect = useCallback((system: System | null) => {
    setSelectedSystemId(system?.id ?? null);
  }, []);

  const handleMockTick = useCallback(() => {
    const updatedState = simulateTick(gameState);
    setGameState(updatedState);
  }, [gameState]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fff',
        }}
      >
        Loading galaxy...
      </div>
    );
  }

  if (error || !gameState.galaxy) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fff',
        }}
      >
        <div style={{ marginBottom: '16px' }}>Error: {error || 'Galaxy not found'}</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            background: '#4a9eff',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const selectedSystem = selectedSystemId
    ? (gameState.systems.find((system) => system.id === selectedSystemId) as
        | (System & { yields?: SystemYields })
        | undefined)
    : undefined;

  const isOwnedByPlayer = selectedSystem
    ? gameState.ownership.some(
        (ownership) =>
          ownership.system_id === selectedSystem.id &&
          ownership.player_id === (user?.id ?? devPlayerId)
      )
    : false;

  const fleetsForCanvas = supabase ? [] : devFleets;
  const fleetAtSystem = selectedSystem
    ? fleetsForCanvas.find((fleet) => fleet.locationSystemId === selectedSystem.id) || null
    : null;

  const panelSystem = selectedSystem
    ? {
        id: selectedSystem.id,
        name: selectedSystem.name,
        x: selectedSystem.x,
        y: selectedSystem.y,
        ownerStatus: isOwnedByPlayer ? 'Owned' : 'Neutral',
        yields: selectedSystem.yields ?? { energy: 0, minerals: 0, science: 0 },
        planetCount: selectedSystem.planetCount ?? 0,
        fleetStrength: fleetAtSystem ? fleetAtSystem.strength : null,
      }
    : null;

  const totalPlanets = gameState.systems.length;
  const ownedCount = gameState.ownership.filter(
    (ownership) => ownership.player_id === (user?.id ?? devPlayerId)
  ).length;

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: '#0a0a0a',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px 16px',
            background: '#151515',
            borderBottom: '1px solid #333',
            color: '#ddd',
            fontSize: '14px',
          }}
        >
          Planets: {totalPlanets} • Owned: {ownedCount}
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <MapCanvas
            systems={gameState.systems}
            lanes={gameState.lanes}
            ownership={gameState.ownership}
            fleets={fleetsForCanvas}
            viewport={viewport}
            onViewportChange={setViewport}
            onSystemSelect={handleSystemSelect}
            selectedSystemId={selectedSystemId}
            playerColor={gameState.currentPlayer?.color || null}
            playerId={user?.id ?? devPlayerId}
            highlightSystemIds={[]}
          />
        </div>
      </div>

      <div style={{ width: '300px', height: '100%' }}>
        {panelSystem ? <SystemPanel system={panelSystem} /> : null}
      </div>

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '12px 24px',
          color: '#fff',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <strong>{gameState.galaxy.name}</strong> | Tick: {gameState.galaxy.tick} | Status:{' '}
            {gameState.galaxy.status}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '6px 12px',
              background: '#4a1a1a',
              border: '1px solid #aa4444',
              borderRadius: '4px',
              color: '#ff8888',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Back to Lobby
          </button>
          {/* Dev-only mock tick button */}
          {IS_DEV && (
            <button
              onClick={handleMockTick}
              style={{
                padding: '6px 12px',
                background: '#4a4a1a',
                border: '1px solid #aaaa44',
                borderRadius: '4px',
                color: '#ffff88',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Mock Tick (Dev)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
