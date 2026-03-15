# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Synapse is an autonomous AI agent collective intelligence visualizer — a React app that simulates 6 specialized AI agents (ORACLE, NEXUS, FORGE, ECHO, CIPHER, SAGE) thinking, communicating, and reaching consensus in real-time. It has two modes: autonomous simulation (template-based thoughts) and real AI mode (Claude API). The full specification lives in `SYNAPSE_PRD.md`.

## Tech Stack

- **React 19 + Vite 8** — UI framework and build tool
- **TypeScript** — strict typing throughout
- **Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing** — 3D visualization with Bloom post-processing
- **Framer Motion** — UI animations
- **D3.js** — confidence/learning charts
- **Zustand** — global state management
- **TailwindCSS v4** — utility styling (via `@tailwindcss/postcss`)

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server with HMR
npm run build        # TypeScript check + production build (tsc -b && vite build)
npm run lint         # ESLint
npm run preview      # preview production build locally
```

No test framework is configured. The build command (`tsc -b`) serves as the type-check gate. Production deploys from the `dist/` folder. Base path is `/Synapse/` (configured in `vite.config.ts`).

## Architecture

**No backend.** Everything runs client-side.

### Core layers

1. **Simulation Engine** (`src/agents/SimulationEngine.ts`) — autonomous tick loop (4s interval). Each tick: picks an agent to think (weighted random favoring less-recently-active), generates a thought, sends it to 1-2 receivers, updates confidence scores. Every 8 ticks triggers a consensus check. Integrates audio events (`useSynapseAudio`) for thought pings, connection sweeps, and consensus chimes.

2. **Agent Definitions** (`src/agents/agentDefinitions.ts`) — configs for the 6 agents (id, name, role, color, 3D position, personality). Each agent has 20+ thought templates in `thoughtTemplates.ts`. Agent positions form an octahedron-like 3D layout.

3. **Zustand Store** (`src/store/useSimStore.ts`) — single global store holding: agent states (confidence, thoughts, thinking status, history), messages, active edges, consensus events, simulation mode (simulation vs solving), API mode toggle, focused agent for camera, and all mutation actions.

4. **Hooks** (`src/hooks/`):
   - `useSimulationLoop.ts` — drives the setInterval tick engine, handles problem rotation
   - `useAgentThought.ts` — generates thoughts; in simulation mode uses templates, in API mode calls Claude API with per-agent system prompts and conversation context. Also handles consensus summaries and consensus-phase thoughts
   - `useTypewriter.ts` — typewriter text animation effect
   - `useSynapseAudio.ts` — Web Audio API procedural sound engine (ambient hum, thought pings per-agent, connection sweeps, consensus chime). Toggled via StatusBar

5. **3D Network** (`src/components/network/`) — React Three Fiber canvas with:
   - `AgentNode` — glowing spheres with phong material, confidence arc (torus), thinking vortex particles, energy burst
   - `ConnectionEdge` — active beams with tube geometry conduit, energy pulse spheres, flow particles
   - `NeuralEdge` — static curved connections with flowing dots
   - `KnowledgeParticle` — particles traveling along bezier curves during communication
   - `StarField` — multi-layer background stars (deep, mid, bright)
   - `NetworkCamera` — OrbitControls with auto-rotate; supports focus mode (lerp to focused agent position, pause auto-rotate)
   - `AgentNetwork3D` — main canvas wrapper with Bloom post-processing, neural grid, central core, energy dome, ambient activity field, background click plane for clearing focus
   - `Line3D` — helper for line rendering

6. **Dashboard** (`src/components/dashboard/`):
   - `AgentCard` — routes to per-agent specialized visualizations (not generic text)
   - Each agent has a unique viz component: `OracleDataViz` (metric extraction + segmented gauge), `SageSynthesisViz` (agent overview + synthesis bar), `CipherLogicViz` (logic checks + counters), `EchoMemoryViz` (memory bank + timeline), `NexusNetworkViz` (SVG mini network graph), `ForgeCreativeViz` (heat gauge + stats)
   - `ThoughtStream` — scrolling message feed
   - `LearningChart` — D3 confidence chart
   - `ConsensusPanel`, `ProblemInput`, `ResultsSummary`, `SimToolbar`

7. **Layout** (`src/components/layout/`) — 60/40 split: 3D visualization (left) + dashboard (right). StatusBar at top with sim metrics, API toggle, audio toggle, guide button.

8. **Events** (`src/components/events/`) — ConsensusExplosion overlay and InsightBadge animations.

9. **Guide** (`src/components/guide/GuidePage.tsx`) — in-app modal with agent docs and system overview.

### Key interaction: Agent Focus Mode

Clicking an agent card sets `focusedAgentId` in the store. `NetworkCamera` reads this and lerps the camera to the agent's 3D position. Auto-rotate pauses during focus. Three ways to exit: click same card again, click 3D background, or click the "back to overview" button overlay.

### Visual theme: "Neural Cosmos"

Dark palette with background `#030812`, surface `#0A1628`. Fonts: JetBrains Mono (monospace), Space Grotesk (display). Each agent has a distinct color with glow effects. Bloom post-processing (`intensity=0.8`, `luminanceThreshold=0.3`) makes emissive materials glow. All styles in `src/index.css` using Tailwind v4 `@theme` for CSS variables.

## API Mode (Phase 2)

Toggled via StatusBar button. Requires `VITE_ANTHROPIC_API_KEY` in `.env`. When active:
- `useAgentThought.ts` calls Claude API (`claude-sonnet-4-20250514`) with per-agent system prompts reflecting personality and role
- Agents can ask the user clarifying questions via `[שאלה למשתמש: ...]` tags
- Consensus generates a structured summary via a dedicated API call
- User can send feedback that resets confidence and injects into conversation context
- Uses `anthropic-dangerous-direct-browser-access` header for direct browser API calls

## UI Language

The entire UI is in Hebrew (RTL). Agent names, thoughts, templates, and all UI text are in Hebrew. `html { direction: rtl }` is set globally.
