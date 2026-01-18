import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, IS_DEV } from '@/lib/supabase';
import { MapCanvas } from '@/components/MapCanvas';
import { SystemPanel } from '@/components/SystemPanel';
import type { GameState, System, Viewport, PlayerFleet } from '@/lib/types';
import { getAdjacentSystems } from '@/game/galaxy';
import { simulateTick } from '@/game/mockTick';
import {
  devGalaxy,
  devSystems,
  devLanes,
  devOwnership,
  devPlayerId,
  devPlayerState,
  devFleets,
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
  const [fleetSelected, setFleetSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [fleet, setFleet] = useState<PlayerFleet | null>(devFleets[0] ?? null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const etaLogRef = React.useRef(false);

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

  const handleSystemSelect = useCallback(
    (system: System | null) => {
      if (!system) {
        setSelectedSystemId(null);
        setFleetSelected(false);
        return;
      }

      if (fleet && system.id === fleet.locationSystemId) {
        setSelectedSystemId(system.id);
        setFleetSelected(true);
        return;
      }

      if (fleetSelected && fleet) {
        if (fleet.inTransit) {
          setSelectedSystemId(system.id);
          return;
        }
        const adjacent = getAdjacentSystems(fleet.locationSystemId, gameState.lanes);
        if (!adjacent.includes(system.id)) return;
        const fromSystem = gameState.systems.find((s) => s.id === fleet.locationSystemId);
        const toSystem = gameState.systems.find((s) => s.id === system.id);
        if (!fromSystem || !toSystem) return;
        const dist = Math.hypot(toSystem.x - fromSystem.x, toSystem.y - fromSystem.y);
        const travelMs = Math.max(1500, Math.min(6000, dist * 8));
        const departAt = Date.now();
        setFleet({
          ...fleet,
          inTransit: true,
          fromSystemId: fleet.locationSystemId,
          toSystemId: system.id,
          departAt,
          arriveAt: departAt + travelMs,
        });
        setSelectedSystemId(system.id);
        setFleetSelected(false);
        return;
      }

      setSelectedSystemId(system.id);
    },
    [fleet, fleetSelected, gameState.lanes]
  );

  const handleMockTick = useCallback(() => {
    const updatedState = simulateTick(gameState);
    setGameState(updatedState);
  }, [gameState]);

  useEffect(() => {
    if (!fleet?.inTransit) return;
    let frame = 0;
    const tick = () => {
      setNowMs(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fleet?.inTransit]);


  useEffect(() => {
    if (!fleet?.inTransit || !fleet.arriveAt || !fleet.toSystemId) return;
    if (nowMs < fleet.arriveAt) return;
    setFleet({
      ...fleet,
      locationSystemId: fleet.toSystemId,
      inTransit: false,
      fromSystemId: undefined,
      toSystemId: undefined,
      departAt: undefined,
      arriveAt: undefined,
    });
  }, [fleet, nowMs]);

  useEffect(() => {
    if (!fleet?.inTransit || !fleet.arriveAt) {
      etaLogRef.current = false;
      return;
    }
    if (!etaLogRef.current) {
      console.log('Fleet ETA debug', {
        now: nowMs,
        departAt: fleet.departAt,
        arriveAt: fleet.arriveAt,
        remainingMs: Math.max(0, fleet.arriveAt - nowMs),
      });
      etaLogRef.current = true;
    }
  }, [fleet?.inTransit, fleet?.arriveAt, fleet?.departAt, nowMs]);


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
    ? gameState.systems.find((system) => system.id === selectedSystemId)
    : undefined;

  const isOwnedByPlayer = selectedSystem
    ? gameState.ownership.some(
        (ownership) =>
          ownership.system_id === selectedSystem.id &&
          ownership.player_id === (user?.id ?? devPlayerId)
      )
    : false;

  const fleetsForCanvas = fleet ? [fleet] : [];
  const fleetAtSystem = selectedSystem
    ? fleetsForCanvas.find((fleet) => fleet.locationSystemId === selectedSystem.id) || null
    : null;
  const adjacentTargets =
    fleetSelected && fleet && !fleet.inTransit
      ? getAdjacentSystems(fleet.locationSystemId, gameState.lanes)
      : [];

  const panelSystem = selectedSystem
    ? {
        id: selectedSystem.id,
        name: selectedSystem.name,
        x: selectedSystem.x,
        y: selectedSystem.y,
        ownerStatus: (isOwnedByPlayer ? 'Owned' : 'Neutral') as 'Owned' | 'Neutral',
        yields: selectedSystem.yields ?? { energy: 0, minerals: 0, science: 0 },
        planetCount: selectedSystem.planetCount ?? 0,
        fleetStrength: fleetAtSystem ? fleetAtSystem.strength : null,
        fleetPrompt: fleetSelected && !fleet?.inTransit,
        fleetStatus:
          fleetSelected && fleet?.inTransit && fleet.arriveAt
            ? `Fleet in transit (ETA: ${Math.max(
                0,
                Math.ceil((fleet.arriveAt - nowMs) / 1000)
              )}s)`
            : null,
      }
    : null;

  const fleetStatusText = fleet?.inTransit && fleet.arriveAt
    ? (() => {
        const remainingMs = Math.max(0, fleet.arriveAt - nowMs);
        const etaSec = Math.ceil(remainingMs / 1000);
        return remainingMs === 0 ? 'Fleet: Arriving…' : `Fleet: In transit • ETA: ${etaSec}s`;
      })()
    : 'Fleet: Idle';

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
          Planets: {totalPlanets} • Owned: {ownedCount} • {fleetStatusText}
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <MapCanvas
            systems={gameState.systems}
            lanes={gameState.lanes}
            ownership={gameState.ownership}
            fleets={fleetsForCanvas}
            nowMs={nowMs}
            viewport={viewport}
            onViewportChange={setViewport}
            onSystemSelect={handleSystemSelect}
            selectedSystemId={selectedSystemId}
            playerColor={gameState.currentPlayer?.color || null}
            playerId={user?.id ?? devPlayerId}
            highlightSystemIds={adjacentTargets}
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
