import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { System, Lane, Ownership, Viewport, PlayerFleet } from '@/lib/types';

interface MapCanvasProps {
  systems: System[];
  lanes: Lane[];
  ownership: Ownership[];
  fleets: PlayerFleet[];
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  onSystemSelect: (system: System | null) => void;
  selectedSystemId?: string | null;
  playerColor?: string | null;
  playerId?: string | null;
  highlightSystemIds?: string[];
}

const SYSTEM_RADIUS = 15;
const SELECTION_RADIUS = 15;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;

const LANE_COLOR = '#444';
const SYSTEM_NEUTRAL_FILL = '#666';
const SYSTEM_PLAYER_FILL = '#4a9eff';
const SYSTEM_LABEL_COLOR = '#fff';
const SELECTED_RING_COLOR = '#00ffff';
const FLEET_MARKER_COLOR = '#ffffff';

const DRAG_THRESHOLD_PX = 5;
const INERTIA_DECAY = 0.92;
const INERTIA_MIN_SPEED = 0.02;

export function MapCanvas({
  systems,
  lanes,
  ownership,
  fleets,
  viewport,
  onViewportChange,
  onSystemSelect,
  selectedSystemId,
  playerColor,
  playerId,
  highlightSystemIds = [],
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastViewport, setLastViewport] = useState(viewport);
  const viewportRef = useRef(viewport);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const dragDistanceRef = useRef(0);

  // Update last viewport when prop changes
  useEffect(() => {
    setLastViewport(viewport);
    viewportRef.current = viewport;
  }, [viewport]);

  // Create ownership map for quick lookup
  const ownershipMap = new Map(ownership.map((o) => [o.system_id, o]));
  const fleetsSafe = Array.isArray(fleets) ? fleets : [];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Transform context for viewport
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(viewport.zoom, viewport.zoom);
    ctx.translate(-viewport.x, -viewport.y);

    // Draw lanes
    ctx.strokeStyle = LANE_COLOR;
    ctx.lineWidth = 2 / viewport.zoom;
    for (const lane of lanes) {
      const fromSystem = systems.find((s) => s.id === lane.from_system_id);
      const toSystem = systems.find((s) => s.id === lane.to_system_id);
      
      if (fromSystem && toSystem) {
        ctx.beginPath();
        ctx.moveTo(fromSystem.x, fromSystem.y);
        ctx.lineTo(toSystem.x, toSystem.y);
        ctx.stroke();
      }
    }

    // Draw systems
    for (const system of systems) {
      const owned = ownershipMap.get(system.id);
      const isSelected = system.id === selectedSystemId;
      const isHighlighted = highlightSystemIds.includes(system.id);

      // System circle
      let fillColor = SYSTEM_NEUTRAL_FILL;
      if (owned && playerId && owned.player_id === playerId) {
        fillColor = playerColor || SYSTEM_PLAYER_FILL;
      }

      if (isHighlighted) {
        // Draw highlight circle
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(system.x, system.y, SYSTEM_RADIUS + 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(system.x, system.y, SYSTEM_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Selected border
      if (isSelected) {
        ctx.strokeStyle = SELECTED_RING_COLOR;
        ctx.lineWidth = 4 / viewport.zoom;
        ctx.beginPath();
        ctx.arc(system.x, system.y, SYSTEM_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // System name
      ctx.fillStyle = SYSTEM_LABEL_COLOR;
      ctx.font = `${12 / viewport.zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(system.name, system.x, system.y + SYSTEM_RADIUS + 5);
    }

    // Draw fleets
    for (const fleet of fleetsSafe) {
      const system = systems.find((s) => s.id === fleet.locationSystemId);
      if (!system) continue;
      ctx.fillStyle = FLEET_MARKER_COLOR;
      ctx.beginPath();
      ctx.arc(system.x, system.y, 5 / viewport.zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [
    systems,
    lanes,
    ownership,
    fleetsSafe,
    viewport,
    selectedSystemId,
    playerColor,
    playerId,
    highlightSystemIds,
    ownershipMap,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const stopInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const startInertia = useCallback(() => {
    stopInertia();
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      const velocity = velocityRef.current;
      const speed = Math.hypot(velocity.x, velocity.y);

      if (speed < INERTIA_MIN_SPEED || isDragging) {
        stopInertia();
        return;
      }

      const currentViewport = viewportRef.current;
      onViewportChange({
        ...currentViewport,
        x: currentViewport.x + velocity.x * dt,
        y: currentViewport.y + velocity.y * dt,
      });

      velocityRef.current = {
        x: velocity.x * INERTIA_DECAY,
        y: velocity.y * INERTIA_DECAY,
      };

      inertiaFrameRef.current = requestAnimationFrame(step);
    };

    inertiaFrameRef.current = requestAnimationFrame(step);
  }, [isDragging, onViewportChange, stopInertia]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    stopInertia();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = { x: 0, y: 0 };
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const now = performance.now();
    const dxScreen = e.clientX - lastPointerRef.current.x;
    const dyScreen = e.clientY - lastPointerRef.current.y;
    const dt = Math.max(1, now - lastMoveTimeRef.current);

    dragDistanceRef.current += Math.hypot(dxScreen, dyScreen);

    const dxWorld = dxScreen / viewport.zoom;
    const dyWorld = dyScreen / viewport.zoom;

    velocityRef.current = {
      x: -dxWorld / dt,
      y: -dyWorld / dt,
    };

    onViewportChange({
      ...viewport,
      x: viewport.x - dxWorld,
      y: viewport.y - dyWorld,
    });

    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    lastMoveTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragDistanceRef.current <= DRAG_THRESHOLD_PX) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const worldX = (x - canvas.width / 2) / viewport.zoom + viewport.x;
      const worldY = (y - canvas.height / 2) / viewport.zoom + viewport.y;

      let nearestSystem: System | null = null;
      let nearestDistance = Infinity;

      for (const system of systems) {
        const dx = worldX - system.x;
        const dy = worldY - system.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= SELECTION_RADIUS && distance < nearestDistance) {
          nearestSystem = system;
          nearestDistance = distance;
        }
      }

      onSystemSelect(nearestSystem);
      return;
    }

    startInertia();
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      stopInertia();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom * delta));

      onViewportChange({
        ...viewport,
        zoom: newZoom,
      });
    },
    [onViewportChange, viewport]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsDragging(false)}
    />
  );
}
