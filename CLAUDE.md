# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Synapse is an autonomous AI agent collective intelligence visualizer — a React app that simulates 6 specialized AI agents (ORACLE, NEXUS, FORGE, ECHO, CIPHER, SAGE) thinking, communicating, and reaching consensus in real-time with zero user interaction. The full specification lives in `SYNAPSE_PRD.md`.

## Tech Stack

- **React 19 + Vite 8** — UI framework and build tool
- **TypeScript** — strict typing throughout
- **Three.js + @react-three/fiber + @react-three/drei** — 3D agent network visualization
- **Framer Motion** — UI animations
- **D3.js** — confidence/learning charts
- **Zustand** — global state management
- **TailwindCSS v4** — utility styling (via `@tailwindcss/postcss`)

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server with HMR
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run preview      # preview production build locally
```

## Architecture

**No backend.** Everything runs client-side. Phase 2 will optionally integrate Claude API via a single toggle in `src/hooks/useAgentThought.ts`.

### Core layers

1. **Simulation Engine** (`src/agents/SimulationEngine.ts`) — autonomous tick loop (4s interval). Each tick: picks an agent to think, generates a thought, sends it to 1-2 receivers, updates confidence scores. Every 8 ticks triggers a consensus check.

2. **Agent Definitions** (`src/agents/agentDefinitions.ts`) — configs for the 6 agents (id, name, role, color, 3D position, personality). Each agent has 20+ thought templates in `thoughtTemplates.ts`.

3. **Zustand Store** (`src/store/useSimStore.ts`) — single global store holding agent states, messages, insights, and simulation events.

4. **Hooks** (`src/hooks/`) — `useSimulationLoop.ts` drives the setInterval tick engine; `useAgentThought.ts` generates thoughts (swappable for real API calls); `useTypewriter.ts` for typewriter text effect.

5. **3D Network** (`src/components/network/`) — React Three Fiber canvas with glowing agent nodes, animated communication beams, knowledge particles, star field, and auto-rotating camera.

6. **Dashboard** (`src/components/dashboard/`) — agent cards, thought stream, D3 learning chart, consensus panel.

7. **Layout** (`src/components/layout/`) — 60/40 split: 3D visualization (left) + dashboard (right). StatusBar at top shows cycle count, sim time, global confidence.

8. **Events** (`src/components/events/`) — ConsensusExplosion overlay and InsightBadge animations.

### Visual theme: "Neural Cosmos"

Dark palette with background `#030812`, surface `#0A1628`. Fonts: JetBrains Mono (monospace), Space Grotesk (display). Each agent has a distinct color with glow effects. All styles in `src/index.css` using Tailwind v4 `@theme` for CSS variables.

## API-Ready Design

The simulation engine is designed so that swapping simulated thoughts for real Claude API calls requires changing only `useAgentThought.ts` (toggle `USE_REAL_API`). Phase 2 uses `VITE_ANTHROPIC_API_KEY` from `.env`.
