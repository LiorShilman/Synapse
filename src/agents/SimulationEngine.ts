import { AGENTS } from './agentDefinitions';
import { generateThought, generateReply, getThoughtCategory, generateConsensusSummary, generateConsensusThought, getSimulatedThought as getSimulatedReply } from '../hooks/useAgentThought';
import { useSimStore } from '../store/useSimStore';
import { playThoughtPing, playConnectionSweep, playConsensusChime } from '../hooks/useSynapseAudio';

function pickWeightedAgent(): string {
  const store = useSimStore.getState();
  const agents = Object.values(store.agents);
  // Weight by how long since last active (favor less recently active)
  const weights = agents.map((a) => {
    const gap = store.tickCount - a.lastActiveAt + 1;
    return gap * gap; // quadratic weighting
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < agents.length; i++) {
    r -= weights[i];
    if (r <= 0) return agents[i].id;
  }
  return agents[agents.length - 1].id;
}

function pickReceivers(senderId: string, count: number): string[] {
  const others = AGENTS.filter((a) => a.id !== senderId);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((a) => a.id);
}

// Prevent overlapping ticks — skip if previous tick is still processing
let tickInProgress = false;

async function executeTick() {
  if (tickInProgress) return;
  tickInProgress = true;
  try {
    await executeTickInner();
  } finally {
    tickInProgress = false;
  }
}

async function executeTickInner() {
  const store = useSimStore.getState();
  const senderId = pickWeightedAgent();
  const receivers = pickReceivers(senderId, 1 + (Math.random() > 0.6 ? 1 : 0));
  const otherAgentIds = AGENTS.filter((a) => a.id !== senderId).map((a) => a.id);

  // Sender starts thinking
  store.setAgentThinking(senderId, true);
  store.updateLastActive(senderId);

  // Generate thought
  const thought = await generateThought(senderId, {
    currentProblem: store.currentProblem,
    otherAgentIds,
  });

  const category = getThoughtCategory(senderId);

  // Check if agent is asking the user for missing information
  const questionMatch = thought.match(/\[שאלה למשתמש:\s*(.+?)\]/);
  if (questionMatch && store.isApiMode && store.mode === 'solving' && !store.noMoreQuestions) {
    // Extract the question and clean the thought
    const question = questionMatch[1];
    const cleanThought = thought.replace(/\[שאלה למשתמש:\s*.+?\]/, '').trim();
    store.setAgentThought(senderId, cleanThought || thought);
    store.setAgentThinking(senderId, false);
    // Pause and show the question
    store.setPendingQuestion(question);
    store.pauseSolving();
    store.addMessage({
      fromId: senderId,
      toId: 'user',
      text: `❓ ${question}`,
      category: 'question',
    });
    store.incrementTick();
    return;
  }

  // Strip question tags if noMoreQuestions is active (agent ignored the instruction)
  const cleanedThought = store.noMoreQuestions
    ? thought.replace(/\[שאלה למשתמש:\s*.+?\]/g, '').trim() || thought
    : thought;

  // Set thought and stop thinking
  store.setAgentThought(senderId, cleanedThought);
  store.setAgentThinking(senderId, false);

  // Audio: ping for the thinking agent
  const senderDef = AGENTS.find((a) => a.id === senderId);
  if (senderDef) playThoughtPing(senderDef.color);

  // Send to receivers
  for (const receiverId of receivers) {
    store.addActiveEdge({ fromId: senderId, toId: receiverId });
    store.addMessage({ fromId: senderId, toId: receiverId, text: cleanedThought, category });
    playConnectionSweep();

    // Receiver confidence boost
    const boost = 2 + Math.floor(Math.random() * 4);
    store.addConfidence(receiverId, boost);
    // Sender also gets a small boost
    store.addConfidence(senderId, 1 + Math.floor(Math.random() * 2));

    // Remove edge after animation time
    setTimeout(() => {
      useSimStore.getState().removeActiveEdge(senderId, receiverId);
    }, 2000);

    // Receiver reacts after delay — in API mode, responds to sender's thought via API
    setTimeout(async () => {
      const recvStore = useSimStore.getState();
      recvStore.setAgentThinking(receiverId, true);
      recvStore.updateLastActive(receiverId);

      const replyOtherIds = AGENTS.filter((a) => a.id !== receiverId).map((a) => a.id);
      const replyContext = { currentProblem: recvStore.currentProblem, otherAgentIds: replyOtherIds };

      // In API+solving mode: real deliberation (receiver responds to sender's thought)
      // In simulation mode: template-based reply (no API calls)
      const reply = (recvStore.isApiMode && recvStore.mode === 'solving')
        ? await generateReply(receiverId, senderId, cleanedThought, replyContext)
        : getSimulatedReply(receiverId, replyContext);

      const recvCategory = getThoughtCategory(receiverId);
      recvStore.setAgentThought(receiverId, reply);
      recvStore.setAgentThinking(receiverId, false);

      // Add the reply as a message back so other agents see it in context
      if (recvStore.isApiMode && recvStore.mode === 'solving') {
        recvStore.addMessage({ fromId: receiverId, toId: senderId, text: reply, category: recvCategory });
        recvStore.addConfidence(receiverId, 1 + Math.floor(Math.random() * 3));
      }
    }, 1500);
  }

  // Increment tick
  store.incrementTick();

  // Consensus check every 8 ticks (only after at least 8 ticks of real discussion)
  if (store.tickCount >= 8 && store.tickCount % 8 === 0) {
    triggerConsensusCheck();
  }
}

async function triggerConsensusCheck() {
  const store = useSimStore.getState();
  const agents = Object.values(store.agents);
  const allAbove70 = agents.every((a) => a.confidence > 70);
  const isRealMode = store.isApiMode && store.mode === 'solving';

  // סייג׳ יוזם — contextual message
  const sageThought = await generateConsensusThought('sage', 'initiate');
  store.setAgentThought('sage', sageThought);
  store.addMessage({
    fromId: 'sage',
    toId: 'nexus',
    text: sageThought,
    category: 'synthesis',
  });

  setTimeout(async () => {
    const s = useSimStore.getState();
    // נקסוס מרכז — contextual message
    const nexusThought = await generateConsensusThought('nexus', 'coordinate');
    s.setAgentThought('nexus', nexusThought);
    s.addMessage({
      fromId: 'nexus',
      toId: 'cipher',
      text: nexusThought,
      category: 'synthesis',
    });
  }, 1000);

  setTimeout(async () => {
    const s = useSimStore.getState();
    if (allAbove70) {
      // סייפר מאמת — contextual message
      const cipherThought = await generateConsensusThought('cipher', 'validate-pass');
      s.setAgentThought('cipher', cipherThought);
      s.addMessage({
        fromId: 'cipher',
        toId: 'echo',
        text: cipherThought,
        category: 'insight',
      });

      // אקו שומר — contextual message
      const echoThought = await generateConsensusThought('echo', 'store');
      s.setAgentThought('echo', echoThought);

      // אירוע קונצנזוס
      playConsensusChime();
      s.addConsensusEvent(
        `הסכמה קולקטיבית בנושא: ${s.currentProblem}`
      );
      s.boostAllConfidence(10);

      if (!isRealMode) {
        // Simulation mode: build local summary from agent state
        useSimStore.getState().setSimPaused(true);
        const st = useSimStore.getState();
        const agentLines = AGENTS.map((a) => {
          const ag = st.agents[a.id];
          return `- **${a.name}** (${a.role}, ביטחון ${ag?.confidence ?? 0}%): ${ag?.currentThought ?? '—'}`;
        }).join('\n');
        const localSummary = `# סיכום קונצנזוס: ${st.currentProblem}\n\n## תובנות הסוכנים\n${agentLines}\n\n## 🎯 שורה תחתונה\nהסוכנים הגיעו להסכמה קולקטיבית עם ביטחון ממוצע של ${st.globalConfidence}%. זהו מצב סימולציה — לסיכום עם המלצה חד-משמעית, הפעל מצב AI אמיתי.`;
        useSimStore.getState().setSolutionSummary(localSummary);
      } else {
        // API mode: generate a structured summary via LLM
        useSimStore.getState().pauseSolving();

        try {
          const summary = await generateConsensusSummary();
          useSimStore.getState().setSolutionSummary(summary);
        } catch (err) {
          console.error('Failed to generate consensus summary:', err);
          // Use generateConsensusSummary's built-in fallback
          const st = useSimStore.getState();
          const agentLines = AGENTS.map((a) => {
            const ag = st.agents[a.id];
            return `- **${a.name}** (${a.role}): ${ag?.currentThought ?? '—'}`;
          }).join('\n');
          useSimStore.getState().setSolutionSummary(
            `# סיכום קונצנזוס: ${s.currentProblem}\n\n## תובנות הסוכנים\n${agentLines}\n\n## 🎯 שורה תחתונה\nהסוכנים הגיעו להסכמה בנושא "${s.currentProblem}" עם ביטחון ממוצע של ${s.globalConfidence}%. קריאת ה-API לסיכום נכשלה — ראה תובנות הסוכנים למעלה.`
          );
        }
      }

      // סגירה אחרי 4 שניות
      setTimeout(() => {
        const latest = useSimStore.getState();
        const active = latest.consensusEvents.find((c) => c.active);
        if (active) latest.dismissConsensus(active.id);
      }, 4000);
    } else {
      // סייפר — contextual failure message
      const cipherFail = await generateConsensusThought('cipher', 'validate-fail');
      s.setAgentThought('cipher', cipherFail);
      s.addMessage({
        fromId: 'cipher',
        toId: 'sage',
        text: cipherFail,
        category: 'challenge',
      });
    }
  }, 2000);
}

export { executeTick };
