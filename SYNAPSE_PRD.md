# SYNAPSE — AI Agent Collective Intelligence Visualizer
## Product Requirements Document (PRD) for Claude Code

---

## 🎯 MISSION STATEMENT

Build a fully autonomous, visually stunning React application that simulates a network of 6 specialized AI agents that think, communicate, learn from each other, and reach collective conclusions — all without any user interaction. The simulation runs perpetually, showing in real-time how agents share knowledge, update their confidence levels, and achieve consensus.

---

## 🏗️ TECH STACK

```
React 18 + Vite
Three.js + @react-three/fiber + @react-three/drei  → 3D agent network
Framer Motion                                        → UI animations
D3.js                                                → learning/confidence charts
Zustand                                              → global state management
TailwindCSS                                          → utility styling
```

**No backend required.** Everything runs client-side with simulated AI logic. Claude API integration comes in a future phase — the architecture must support it cleanly via a simple toggle.

---

## 📁 PROJECT STRUCTURE

```
synapse/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                    ← global styles, CSS vars, fonts
│   │
│   ├── agents/
│   │   ├── agentDefinitions.js      ← 6 agent configs (name, role, color, position)
│   │   ├── thoughtTemplates.js      ← rich library of simulated thoughts per agent
│   │   └── SimulationEngine.js      ← core autonomous loop logic
│   │
│   ├── store/
│   │   └── useSimStore.js           ← Zustand store (agents, messages, insights, events)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx         ← main layout (3D left, dashboard right)
│   │   │   └── StatusBar.jsx        ← top bar: sim time, cycle count, global confidence
│   │   │
│   │   ├── network/
│   │   │   ├── AgentNetwork3D.jsx   ← R3F Canvas wrapper
│   │   │   ├── AgentNode.jsx        ← glowing sphere per agent with pulse animation
│   │   │   ├── ConnectionEdge.jsx   ← animated beam between agents when communicating
│   │   │   ├── KnowledgeParticle.jsx← small particle flying along edges
│   │   │   └── NetworkCamera.jsx    ← slow auto-rotating camera
│   │   │
│   │   ├── dashboard/
│   │   │   ├── AgentCard.jsx        ← card showing agent status, current thought, confidence
│   │   │   ├── ThoughtStream.jsx    ← live scrolling log of inter-agent messages
│   │   │   ├── LearningChart.jsx    ← D3 line chart of confidence over time per agent
│   │   │   └── ConsensusPanel.jsx   ← shows active consensus events with progress bar
│   │   │
│   │   └── events/
│   │       ├── ConsensusExplosion.jsx ← full-screen flash + text when consensus reached
│   │       └── InsightBadge.jsx       ← animated badge when agent reaches new insight
│   │
│   └── hooks/
│       ├── useSimulationLoop.js     ← setInterval-based autonomous tick engine
│       └── useAgentThought.js       ← generates next thought for an agent
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 👥 THE SIX AGENTS

Each agent has a distinct specialty, color identity, and communication style.

```js
// src/agents/agentDefinitions.js

export const AGENTS = [
  {
    id: 'oracle',
    name: 'ORACLE',
    role: 'Data Analysis & Prediction',
    description: 'Analyzes patterns and generates probabilistic forecasts',
    color: '#4FC3F7',      // ice blue
    glowColor: '#0288D1',
    position: [0, 2, 0],  // 3D position on the sphere layout
    personality: 'analytical, precise, speaks in probabilities',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    role: 'Communication & Coordination',
    description: 'Routes information between agents and manages consensus',
    color: '#CE93D8',      // electric purple
    glowColor: '#7B1FA2',
    position: [2, 0, 1],
    personality: 'diplomatic, connective, always references other agents',
  },
  {
    id: 'forge',
    name: 'FORGE',
    role: 'Solution Generation',
    description: 'Synthesizes inputs into actionable solutions and code',
    color: '#FFAB40',      // molten orange
    glowColor: '#E65100',
    position: [-2, 0, 1],
    personality: 'creative, bold, solution-oriented, uses metaphors',
  },
  {
    id: 'echo',
    name: 'ECHO',
    role: 'Memory & Learning',
    description: 'Stores collective history and identifies learning patterns',
    color: '#66BB6A',      // emerald green
    glowColor: '#2E7D32',
    position: [0, -2, 0],
    personality: 'reflective, references past events, tracks evolution',
  },
  {
    id: 'cipher',
    name: 'CIPHER',
    role: 'Validation & Security',
    description: 'Validates conclusions and detects logical inconsistencies',
    color: '#EF9A9A',      // coral red
    glowColor: '#C62828',
    position: [2, 0, -1],
    personality: 'skeptical, rigorous, challenges assumptions',
  },
  {
    id: 'sage',
    name: 'SAGE',
    role: 'Wisdom & Synthesis',
    description: 'Integrates all perspectives into higher-order conclusions',
    color: '#FFD54F',      // deep gold
    glowColor: '#F57F17',
    position: [-2, 0, -1],
    personality: 'philosophical, integrative, draws final conclusions',
  },
];
```

---

## ⚙️ SIMULATION ENGINE

### Core Loop (every 4 seconds)

```
TICK:
  1. Pick a "thinking" agent (weighted random, favoring less-recently-active)
  2. Generate a thought for that agent (from thoughtTemplates or composed)
  3. Pick 1-2 "receiving" agents (prefer connected/adjacent nodes)
  4. Animate a knowledge pulse along the edges
  5. After 1.5s delay: receiving agents "react" with a reply thought
  6. Update confidence scores (+2 to +5 points, max 100)
  7. Every 8 ticks: trigger a Consensus Check
  8. If all agents confidence > 70: fire ConsensusExplosion event

CONSENSUS CHECK:
  - SAGE initiates: "Requesting collective synthesis..."
  - All agents submit their current top insight
  - NEXUS aggregates: "Consensus forming on: [topic]"
  - CIPHER validates: "Logic verified ✓" or "Anomaly detected ✗"
  - If valid: ECHO stores to collective memory
  - ConsensusExplosion fires with the agreed insight
  - All confidence scores get a +10 boost
```

### Thought Generation (Simulated — no API)

Each agent has ~20 thought templates per category. Categories:

- `discovery` — "I've identified a pattern in..."
- `question` — "NEXUS, what is your read on..."
- `insight` — "Cross-referencing ORACLE's data, I conclude..."
- `challenge` — "CIPHER challenges: this assumes..."
- `synthesis` — "Integrating all inputs: the answer is..."
- `memory` — "ECHO recalls: 3 cycles ago we established..."

Thoughts reference other agents by name for realism. They should feel genuinely intelligent and connected to a consistent "topic" that evolves over time (the simulation has a "current problem" that rotates every ~5 minutes).

### Current Problem Rotation (every 5 min)

The simulation picks a "problem domain" from this list and all thoughts reference it:

```js
const PROBLEM_DOMAINS = [
  'Optimizing distributed resource allocation across dynamic networks',
  'Predicting emergent behavior in complex adaptive systems',
  'Resolving conflicts in multi-objective optimization frameworks',
  'Identifying causal chains in high-dimensional data streams',
  'Developing robust consensus in adversarial environments',
  'Synthesizing knowledge across incompatible ontologies',
];
```

---

## 🎨 VISUAL DESIGN SPECIFICATION

### Theme: "Neural Cosmos"

```css
:root {
  --bg-deep:     #030812;   /* near-black blue */
  --bg-surface:  #0A1628;   /* dark surface */
  --bg-card:     #0D1F3C;   /* card backgrounds */
  --border:      rgba(100, 160, 255, 0.12);
  --text-primary: #E8F4FD;
  --text-secondary: #8BAFD4;
  --text-muted:  #4A6A8A;
  --accent-blue: #4FC3F7;
  --font-mono:   'JetBrains Mono', monospace;
  --font-display: 'Space Grotesk', sans-serif;
}
```

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  SYNAPSE    ●●● CYCLE 47   ⏱ 03:42   CONFIDENCE 78%   │  ← StatusBar
├──────────────────────────┬──────────────────────────────┤
│                          │  ┌──────┐ ┌──────┐ ┌──────┐ │
│                          │  │ORACLE│ │NEXUS │ │FORGE │ │
│    3D AGENT NETWORK      │  └──────┘ └──────┘ └──────┘ │
│    (auto-rotating)       │  ┌──────┐ ┌──────┐ ┌──────┐ │
│    60% width             │  │ECHO  │ │CIPHER│ │SAGE  │ │
│                          │  └──────┘ └──────┘ └──────┘ │
│                          ├──────────────────────────────┤
│                          │  THOUGHT STREAM (scrolling)  │
│                          ├──────────────────────────────┤
│                          │  LEARNING CHART (D3)         │
└──────────────────────────┴──────────────────────────────┘
```

### 3D Network

- Black background with subtle star particles (Three.js Points)
- Agents as glowing spheres (MeshPhongMaterial + PointLight for each)
- Active communication: bright animated beam (Line with dashed animation)
- Knowledge particles: small bright dots flying along edges (animated position)
- Camera: OrbitControls with autoRotate at 0.3 speed, no user interaction
- Ambient light: deep blue (#0A1030), intensity 0.3
- Each agent sphere has a soft halo effect (sprite with additive blending)

### Agent Cards

```
┌─────────────────────────────┐
│ ● ORACLE          [94%] ━━━ │  ← name + confidence bar
│ Data Analysis & Prediction  │  ← role
│                             │
│ "Probability matrix shows   │  ← current thought (typewriter effect)
│  convergence at 87.3%..."   │
│                             │
│ ↗ Sent to NEXUS  2s ago    │  ← last interaction
└─────────────────────────────┘
```

Card border pulses with agent color when that agent is "thinking". Confidence bar fills with agent color.

### Thought Stream

Live scrolling feed, newest at top. Each entry:

```
[12:34:07] FORGE → ECHO
"Applying pattern from cycle 31: the resonance cascade
 suggests a non-linear solution path..."
─────────────────────────────────────────────────
```

Color-coded by sending agent. Auto-scrolls. Max 50 entries (virtualized).

### Learning Chart (D3)

- X axis: simulation ticks (last 50)
- Y axis: confidence 0-100%
- One line per agent, colored with agent color
- Subtle fill under each line (20% opacity)
- No axes labels (too cluttered) — just a legend with agent name + current value

### Consensus Explosion

When consensus fires:
1. Full-screen radial burst animation (CSS keyframes)
2. All agent nodes in 3D pulse white simultaneously
3. Center overlay: "⬡ CONSENSUS ACHIEVED" + the insight text
4. Duration: 4 seconds, then fades

---

## 🔌 API-READY ARCHITECTURE

The simulation engine must be built so that replacing simulated thoughts with real Claude API calls requires changing **only one file**: `src/hooks/useAgentThought.js`.

```js
// src/hooks/useAgentThought.js

const USE_REAL_API = false; // ← flip this to true in Phase 2

export async function generateThought(agent, context) {
  if (USE_REAL_API) {
    // Phase 2: real Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: buildAgentSystemPrompt(agent),
        messages: [{ role: 'user', content: buildThoughtPrompt(agent, context) }],
      }),
    });
    const data = await response.json();
    return data.content[0].text;
  } else {
    // Phase 1: local simulation
    return getSimulatedThought(agent, context);
  }
}
```

When `USE_REAL_API = true`, each agent will have a distinct system prompt reflecting its personality, and the context will include the last 3 messages in the network for continuity.

---

## 📦 PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.115.0",
    "three": "^0.170.0",
    "framer-motion": "^11.11.0",
    "d3": "^7.9.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🚀 IMPLEMENTATION ORDER

Claude Code should build in this sequence:

1. **Scaffold** — Vite + React + Tailwind + all dependencies installed
2. **Store** — Zustand store with agent state, messages, confidence arrays
3. **Agent Definitions** — 6 agents with full thought template libraries (20+ thoughts each per category)
4. **Simulation Engine** — tick loop, thought generation, confidence updates
5. **3D Network** — Three.js canvas with nodes, edges, particles, auto-rotate
6. **Agent Cards** — 6 cards with live thought display and confidence bars
7. **Thought Stream** — scrolling live feed
8. **Learning Chart** — D3 confidence chart
9. **Consensus System** — explosion animation + insight display
10. **StatusBar** — global metrics
11. **Polish** — typewriter effects, card pulse on activity, particle trails

---

## ✅ ACCEPTANCE CRITERIA

- [ ] App starts and simulation begins automatically with no user interaction
- [ ] All 6 agents are visible in the 3D network and the dashboard cards
- [ ] Thoughts appear and update every ~4 seconds
- [ ] Connection beams animate between agents when they communicate
- [ ] Confidence bars animate upward over time
- [ ] D3 chart shows live confidence curves for all 6 agents
- [ ] Thought stream scrolls automatically with color-coded entries
- [ ] Consensus event fires every ~32 seconds with visual explosion
- [ ] Camera auto-rotates the 3D network smoothly
- [ ] `USE_REAL_API = false` flag exists in `useAgentThought.js`
- [ ] App is visually dark, premium, and impressive — Neural Cosmos aesthetic
- [ ] No user interaction required at any point — fully autonomous

---

## 💬 PROMPT TO PASTE INTO CLAUDE CODE

Copy this prompt and run it in Claude Code (VS Code):

```
Build the SYNAPSE AI Collective Intelligence Visualizer according to the full PRD in this file.

Start with: npm create vite@latest synapse -- --template react

Then implement all components in the order specified in the Implementation Order section.

Key requirements:
- Fully autonomous — no user interaction needed
- Dark Neural Cosmos aesthetic (#030812 background, glowing agents)
- 3D network with Three.js/React Three Fiber
- 6 specialized agents with distinct personalities and colored identities
- Simulation tick every 4 seconds generating inter-agent communication
- Consensus events with full-screen explosion every ~32 seconds
- Architecture ready for Claude API (USE_REAL_API flag in useAgentThought.js)

After scaffolding, show me the file structure before implementing each major component.
```

---

## 🔮 PHASE 2 — REAL API (FUTURE)

When ready to connect the real Claude API:

1. Add `.env` with `VITE_ANTHROPIC_API_KEY=sk-ant-...`
2. Set `USE_REAL_API = true` in `useAgentThought.js`
3. Each agent gets a distinct system prompt built from `agentDefinitions.js`
4. Context window = last 5 messages in the network
5. Rate limit protection: max 1 API call per second across all agents
6. Fallback to simulation if API errors

Agent system prompts example:

```
You are ORACLE, an AI agent specialized in data analysis and prediction.
You are part of a 6-agent collective intelligence network.
Current problem: {currentProblem}
Recent network messages: {context}
Respond in 1-2 sentences, in character, referencing other agents by name when relevant.
Be analytical and precise. Speak in probabilities and patterns.
```

---

*PRD Version 1.0 — Ready for Claude Code implementation*
*Next phase: Claude API integration (USE_REAL_API flag)*
