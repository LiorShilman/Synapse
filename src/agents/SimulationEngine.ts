import { AGENTS } from './agentDefinitions';
import { generateThought, getThoughtCategory, generateConsensusSummary } from '../hooks/useAgentThought';
import { useSimStore } from '../store/useSimStore';

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

async function executeTick() {
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

  // Set thought and stop thinking
  store.setAgentThought(senderId, thought);
  store.setAgentThinking(senderId, false);

  // Send to receivers
  for (const receiverId of receivers) {
    store.addActiveEdge({ fromId: senderId, toId: receiverId });
    store.addMessage({ fromId: senderId, toId: receiverId, text: thought, category });

    // Receiver confidence boost
    const boost = 2 + Math.floor(Math.random() * 4);
    store.addConfidence(receiverId, boost);
    // Sender also gets a small boost
    store.addConfidence(senderId, 1 + Math.floor(Math.random() * 2));

    // Remove edge after animation time
    setTimeout(() => {
      useSimStore.getState().removeActiveEdge(senderId, receiverId);
    }, 2000);

    // Receiver reacts after delay
    setTimeout(async () => {
      const recvStore = useSimStore.getState();
      const replyOtherIds = AGENTS.filter((a) => a.id !== receiverId).map((a) => a.id);
      recvStore.setAgentThinking(receiverId, true);
      recvStore.updateLastActive(receiverId);

      const reply = await generateThought(receiverId, {
        currentProblem: recvStore.currentProblem,
        otherAgentIds: replyOtherIds,
      });

      const replyStore = useSimStore.getState();
      replyStore.setAgentThought(receiverId, reply);
      replyStore.setAgentThinking(receiverId, false);
    }, 1500);
  }

  // Increment tick
  store.incrementTick();

  // Consensus check every 8 ticks
  if (store.tickCount > 0 && store.tickCount % 8 === 0) {
    triggerConsensusCheck();
  }
}

async function triggerConsensusCheck() {
  const store = useSimStore.getState();
  const agents = Object.values(store.agents);
  const allAbove70 = agents.every((a) => a.confidence > 70);
  const isRealMode = store.isApiMode && store.mode === 'solving';

  // סייג׳ יוזם
  store.setAgentThought('sage', 'מבקש סינתזה קולקטיבית... כל הסוכנים, הגישו את התובנה ברמת הביטחון הגבוהה ביותר');
  store.addMessage({
    fromId: 'sage',
    toId: 'nexus',
    text: 'מבקש סינתזה קולקטיבית... כל הסוכנים, הגישו את התובנה ברמת הביטחון הגבוהה ביותר',
    category: 'synthesis',
  });

  setTimeout(() => {
    const s = useSimStore.getState();
    // נקסוס מרכז
    s.setAgentThought('nexus', `קונצנזוס מתגבש בנושא: ${s.currentProblem}`);
    s.addMessage({
      fromId: 'nexus',
      toId: 'cipher',
      text: `קונצנזוס מתגבש בנושא: ${s.currentProblem}`,
      category: 'synthesis',
    });
  }, 1000);

  setTimeout(async () => {
    const s = useSimStore.getState();
    if (allAbove70) {
      // סייפר מאמת
      s.setAgentThought('cipher', 'לוגיקה אומתה ✓ — כל הטענות עומדות תחת בחינה');
      s.addMessage({
        fromId: 'cipher',
        toId: 'echo',
        text: 'לוגיקה אומתה ✓ — כל הטענות עומדות תחת בחינה',
        category: 'insight',
      });

      // אקו שומר
      s.setAgentThought('echo', 'שומר קונצנזוס בזיכרון הקולקטיבי — זו כעת אמת יסוד');

      // אירוע קונצנזוס
      s.addConsensusEvent(
        `הסכמה קולקטיבית בנושא: ${s.currentProblem}`
      );
      s.boostAllConfidence(10);

      // In real API mode, generate a structured summary
      if (isRealMode) {
        try {
          const summary = await generateConsensusSummary();
          useSimStore.getState().setSolutionSummary(summary);
        } catch (err) {
          console.error('Failed to generate consensus summary:', err);
          useSimStore.getState().setSolutionSummary(
            `הסוכנים הגיעו להסכמה בנושא "${s.currentProblem}" עם ביטחון ממוצע של ${s.globalConfidence}%.`
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
      s.setAgentThought('cipher', 'אנומליה זוהתה ✗ — סף הביטחון טרם הושג');
      s.addMessage({
        fromId: 'cipher',
        toId: 'sage',
        text: 'אנומליה זוהתה ✗ — ביטחון קולקטיבי לא מספיק לקונצנזוס',
        category: 'challenge',
      });
    }
  }, 2000);
}

export { executeTick };
