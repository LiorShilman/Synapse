import { create } from 'zustand';
import { AGENTS, PROBLEM_DOMAINS } from '../agents/agentDefinitions';

export interface AgentState {
  id: string;
  confidence: number;
  currentThought: string;
  isThinking: boolean;
  lastActiveAt: number;
  confidenceHistory: number[];
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: number;
  category: string;
}

export interface ActiveEdge {
  fromId: string;
  toId: string;
  startTime: number;
}

export interface ConsensusEvent {
  id: string;
  insight: string;
  timestamp: number;
  active: boolean;
}

export type SimMode = 'simulation' | 'solving';

export type LlmProvider = 'anthropic' | 'openai';

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  endpoint: string;
}

const LLM_STORAGE_KEY = 'synapse-llm-config';

function loadLlmConfig(): LlmConfig {
  try {
    const saved = localStorage.getItem(LLM_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    provider: 'anthropic',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
    model: 'claude-sonnet-4-20250514',
    endpoint: 'https://api.anthropic.com',
  };
}

function saveLlmConfig(config: LlmConfig) {
  try { localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

interface SimState {
  agents: Record<string, AgentState>;
  messages: Message[];
  activeEdges: ActiveEdge[];
  tickCount: number;
  startTime: number;
  currentProblem: string;
  consensusEvents: ConsensusEvent[];
  globalConfidence: number;

  // LLM config
  llmConfig: LlmConfig;
  setLlmConfig: (config: LlmConfig) => void;

  // Phase 2: AI mode
  mode: SimMode;
  userProblem: string;
  isApiMode: boolean;
  solutionSummary: string | null;
  isSolving: boolean;
  simPaused: boolean;
  pendingQuestion: string | null;
  noMoreQuestions: boolean;

  // Focus mode
  focusedAgentId: string | null;
  setFocusedAgent: (id: string | null) => void;

  // Actions
  setAgentThinking: (id: string, thinking: boolean) => void;
  setAgentThought: (id: string, thought: string) => void;
  addConfidence: (id: string, amount: number) => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  addActiveEdge: (edge: Omit<ActiveEdge, 'startTime'>) => void;
  removeActiveEdge: (fromId: string, toId: string) => void;
  incrementTick: () => void;
  rotateProblem: () => void;
  addConsensusEvent: (insight: string) => void;
  dismissConsensus: (id: string) => void;
  boostAllConfidence: (amount: number) => void;
  updateLastActive: (id: string) => void;

  // Phase 2 actions
  setUserProblem: (problem: string) => void;
  startSolving: () => void;
  stopSolving: () => void;
  pauseSolving: () => void;
  resumeSolving: () => void;
  setSolutionSummary: (summary: string | null) => void;
  setApiMode: (enabled: boolean) => void;
  resetForNewProblem: () => void;
  sendUserFeedback: (feedback: string) => void;
  setSimPaused: (paused: boolean) => void;
  setPendingQuestion: (question: string | null) => void;
}

const initAgents = (): Record<string, AgentState> => {
  const map: Record<string, AgentState> = {};
  for (const a of AGENTS) {
    map[a.id] = {
      id: a.id,
      confidence: 20 + Math.floor(Math.random() * 20),
      currentThought: '',
      isThinking: false,
      lastActiveAt: 0,
      confidenceHistory: [],
    };
  }
  return map;
};

let messageId = 0;
let consensusId = 0;

export const useSimStore = create<SimState>((set) => ({
  agents: initAgents(),
  messages: [],
  activeEdges: [],
  tickCount: 0,
  startTime: Date.now(),
  currentProblem: PROBLEM_DOMAINS[0],
  consensusEvents: [],
  globalConfidence: 0,

  // LLM config
  llmConfig: loadLlmConfig(),
  setLlmConfig: (config: LlmConfig) => {
    saveLlmConfig(config);
    set({ llmConfig: config });
  },

  // Phase 2
  mode: 'simulation' as SimMode,
  userProblem: '',
  isApiMode: false,
  solutionSummary: null,
  isSolving: false,
  simPaused: false,
  pendingQuestion: null,
  noMoreQuestions: false,
  focusedAgentId: null,

  setFocusedAgent: (id) => set({ focusedAgentId: id }),

  setAgentThinking: (id, thinking) =>
    set((s) => ({
      agents: { ...s.agents, [id]: { ...s.agents[id], isThinking: thinking } },
    })),

  setAgentThought: (id, thought) =>
    set((s) => ({
      agents: { ...s.agents, [id]: { ...s.agents[id], currentThought: thought } },
    })),

  addConfidence: (id, amount) =>
    set((s) => {
      const agent = s.agents[id];
      const newConf = Math.min(100, agent.confidence + amount);
      return {
        agents: { ...s.agents, [id]: { ...agent, confidence: newConf } },
      };
    }),

  addMessage: (msg) =>
    set((s) => {
      const newMsg: Message = {
        ...msg,
        id: `msg-${++messageId}`,
        timestamp: Date.now(),
      };
      const messages = [newMsg, ...s.messages];
      return { messages };
    }),

  addActiveEdge: (edge) =>
    set((s) => ({
      activeEdges: [...s.activeEdges, { ...edge, startTime: Date.now() }],
    })),

  removeActiveEdge: (fromId, toId) =>
    set((s) => ({
      activeEdges: s.activeEdges.filter(
        (e) => !(e.fromId === fromId && e.toId === toId)
      ),
    })),

  incrementTick: () =>
    set((s) => {
      // Record confidence history snapshot, clamp confidence to [0, 100]
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        const a = agents[id];
        const clamped = Math.min(100, Math.max(0, a.confidence));
        agents[id] = {
          ...a,
          confidence: clamped,
          confidenceHistory: [...a.confidenceHistory.slice(-49), clamped],
        };
      }
      // Calculate global confidence
      const values = Object.values(agents);
      const globalConfidence = Math.min(100, Math.round(
        values.reduce((sum, a) => sum + a.confidence, 0) / values.length
      ));
      return { tickCount: s.tickCount + 1, agents, globalConfidence };
    }),

  rotateProblem: () =>
    set((s) => {
      const idx = PROBLEM_DOMAINS.indexOf(s.currentProblem);
      const next = PROBLEM_DOMAINS[(idx + 1) % PROBLEM_DOMAINS.length];
      return { currentProblem: next };
    }),

  addConsensusEvent: (insight) =>
    set((s) => ({
      consensusEvents: [
        ...s.consensusEvents,
        {
          id: `cons-${++consensusId}`,
          insight,
          timestamp: Date.now(),
          active: true,
        },
      ],
    })),

  dismissConsensus: (id) =>
    set((s) => ({
      consensusEvents: s.consensusEvents.map((c) =>
        c.id === id ? { ...c, active: false } : c
      ),
    })),

  boostAllConfidence: (amount) =>
    set((s) => {
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        const a = agents[id];
        agents[id] = { ...a, confidence: Math.min(100, a.confidence + amount) };
      }
      return { agents };
    }),

  updateLastActive: (id) =>
    set((s) => ({
      agents: {
        ...s.agents,
        [id]: { ...s.agents[id], lastActiveAt: s.tickCount },
      },
    })),

  // Phase 2 actions
  setUserProblem: (problem) => set({ userProblem: problem }),

  pauseSolving: () => set({ isSolving: false }),
  resumeSolving: () => set({ isSolving: true }),

  startSolving: () =>
    set((s) => {
      // Reset agents for new problem — start at 0% confidence
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        agents[id] = {
          ...agents[id],
          confidence: 0,
          currentThought: '',
          isThinking: false,
          confidenceHistory: [],
        };
      }
      return {
        mode: 'solving' as SimMode,
        isSolving: true,
        currentProblem: s.userProblem,
        agents,
        messages: [],
        activeEdges: [],
        tickCount: 0,
        startTime: Date.now(),
        consensusEvents: [],
        globalConfidence: 0,
        solutionSummary: null,
        pendingQuestion: null,
        noMoreQuestions: false,
      };
    }),

  stopSolving: () => set({ isSolving: false, mode: 'simulation' as SimMode }),

  setSolutionSummary: (summary) => set({ solutionSummary: summary }),

  setApiMode: (enabled) =>
    set((s) => {
      if (enabled) {
        // Clear screen when entering API mode — start at 0% confidence
        const agents = { ...s.agents };
        for (const id of Object.keys(agents)) {
          agents[id] = {
            ...agents[id],
            confidence: 0,
            currentThought: '',
            isThinking: false,
            confidenceHistory: [],
          };
        }
        return {
          isApiMode: true,
          agents,
          messages: [],
          activeEdges: [],
          tickCount: 0,
          startTime: Date.now(),
          consensusEvents: [],
          globalConfidence: 0,
          solutionSummary: null,
          pendingQuestion: null,
          noMoreQuestions: false,
          mode: 'simulation' as SimMode,
          isSolving: false,
          userProblem: '',
        };
      }
      // When disabling API mode, also reset for fresh simulation
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        agents[id] = {
          ...agents[id],
          confidence: 20 + Math.floor(Math.random() * 20),
          currentThought: '',
          isThinking: false,
          confidenceHistory: [],
        };
      }
      return {
        isApiMode: false,
        agents,
        messages: [],
        activeEdges: [],
        tickCount: 0,
        startTime: Date.now(),
        consensusEvents: [],
        globalConfidence: 0,
        solutionSummary: null,
        pendingQuestion: null,
        noMoreQuestions: false,
        mode: 'simulation' as SimMode,
        isSolving: false,
        userProblem: '',
      };
    }),

  resetForNewProblem: () =>
    set((s) => {
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        agents[id] = {
          ...agents[id],
          confidence: 0,
          currentThought: '',
          isThinking: false,
          confidenceHistory: [],
        };
      }
      return {
        agents,
        messages: [],
        activeEdges: [],
        tickCount: 0,
        startTime: Date.now(),
        consensusEvents: [],
        globalConfidence: 0,
        solutionSummary: null,
        pendingQuestion: null,
        userProblem: '',
        currentProblem: '',
        isSolving: false,
        mode: 'simulation' as SimMode,
        // isApiMode stays as-is
      };
    }),

  sendUserFeedback: (feedback) =>
    set((s) => {
      // Add feedback as a special message from "user" to all agents
      const newMsg: Message = {
        id: `msg-${++messageId}`,
        fromId: 'user',
        toId: 'nexus',
        text: feedback,
        timestamp: Date.now(),
        category: 'feedback',
      };
      // Detect if user asks agents to stop asking questions
      const stopPhrases = [
        'תפסיקו לשאול', 'אל תשאלו', 'מספיק שאלות', 'תענו עם מה שיש',
        'תעבדו עם הנתונים', 'stop asking', 'לא עוד שאלות', 'תפסיק לשאול',
        'עם הנתונים שיש', 'הפסיקו לשאול', 'הפסיקו שאלות', 'בלי שאלות',
        'לא לשאול', 'אל תשאל', 'תפסיקו', 'הפסיקו', 'enough questions',
        'no more questions', 'תגמרו', 'מספיק', 'די שאלות', 'די לשאול',
      ];
      const lowerFeedback = feedback.toLowerCase();
      const shouldStopQuestions = stopPhrases.some((p) => lowerFeedback.includes(p));
      // Reset confidence slightly to force re-evaluation
      const agents = { ...s.agents };
      for (const id of Object.keys(agents)) {
        const a = agents[id];
        agents[id] = {
          ...a,
          confidence: Math.max(20, a.confidence - 15),
        };
      }
      return {
        messages: [newMsg, ...s.messages].slice(0, 80),
        agents,
        solutionSummary: null,
        ...(shouldStopQuestions ? { noMoreQuestions: true } : {}),
      };
    }),

  setSimPaused: (paused) => set({ simPaused: paused }),
  setPendingQuestion: (question) => set({ pendingQuestion: question }),
}));
