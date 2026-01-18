# Stellaris Lite

A browser-based space strategy game built with React, TypeScript, and Vite. Manage your empire, explore systems, and command fleets across the galaxy.

## Features

- **Galaxy Map**: Interactive map showing star systems connected by hyperlanes
- **System Information**: View system details including:
  - Planet count (0-6 planets per system)
  - Base yields (Energy, Minerals, Science)
  - Ownership status
  - Fleet presence
- **Fleet Management**: Track fleet locations and strengths
- **Deterministic Generation**: Seeded RNG for reproducible galaxy layouts
- **Multiplayer Support**: Supabase integration for online gameplay (optional dev mode available)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Supabase** - Backend and database (optional)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The app runs in development mode by default without requiring Supabase. A deterministic dev galaxy is generated with:

- 20 star systems
- 3 nearest-neighbor connections per system
- Player-owned systems start with at least 2 planets
- Deterministic planet counts (0-6 per system)

### Project Structure

```
src/
├── components/      # React components (MapCanvas, SystemPanel, FleetPanel)
├── game/           # Game logic (galaxy generation, ticks, orders)
├── lib/            # Utilities (types, RNG, Supabase client)
└── pages/          # Route pages (Lobby, GalaxyMap, SystemView, Empire)
```

## Game Mechanics

### Systems

- Each system has a star type: red_dwarf, yellow, blue_giant, or white_dwarf
- Systems contain 0-6 planets (player-owned systems have at least 2)
- Systems generate base yields for Energy, Minerals, and Science

### Fleets

- Fleets are stationed at systems
- Fleet strength indicates combat capability
- Fleet locations are displayed on the map and in system details

### Galaxy Generation

Galaxies are generated using a seeded RNG for reproducibility:
- Systems are positioned randomly within the galaxy bounds
- Hyperlanes connect each system to its 3 nearest neighbors
- Player home systems are assigned deterministically

## License

[Add your license here]
