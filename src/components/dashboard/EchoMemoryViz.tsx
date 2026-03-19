import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore';
import { AGENTS } from '../../agents/agentDefinitions';

interface EchoMemoryVizProps {
  thought: string;
}

function getMemoryPhase(thought: string): { text: string; color: string } {
  if (thought.includes('שומר') || thought.includes('מאחסן') || thought.includes('סומנו'))
    return { text: 'STORING', color: '#66BB6A' };
  if (thought.includes('זיהוי') || thought.includes('דפוס') || thought.includes('לולאת'))
    return { text: 'PATTERN', color: '#4FC3F7' };
  if (thought.includes('נזכר') || thought.includes('היסטורי') || thought.includes('תקדים'))
    return { text: 'RECALL', color: '#CE93D8' };
  if (thought.includes('אזהרה') || thought.includes('סותרים') || thought.includes('מבוי'))
    return { text: 'CONFLICT', color: '#EF9A9A' };
  if (thought.includes('למידה') || thought.includes('מטא') || thought.includes('פיתול'))
    return { text: 'LEARNING', color: '#FFD54F' };
  return { text: 'SCANNING', color: '#66BB6A' };
}

export default function EchoMemoryViz({ thought }: EchoMemoryVizProps) {
  const messages = useSimStore((s) => s.messages);
  const tickCount = useSimStore((s) => s.tickCount);
  const phase = useMemo(() => getMemoryPhase(thought), [thought]);

  // Memory bank stats from echo's message history
  const echoMessages = messages.filter((m) => m.fromId === 'echo');
  const storedCount = echoMessages.filter((m) =>
    m.text.includes('שומר') || m.text.includes('מאחסן') || m.text.includes('סומנו')
  ).length;
  const patternsFound = echoMessages.filter((m) =>
    m.text.includes('דפוס') || m.text.includes('זיהוי') || m.text.includes('לולאת')
  ).length;

  // Recent memories — last 3 unique echo thoughts
  const recentMemories = useMemo(() => {
    const seen = new Set<string>();
    const result: { text: string; agentColor: string; tick: number }[] = [];
    for (const msg of messages) {
      if (msg.fromId === 'echo' && !seen.has(msg.text)) {
        seen.add(msg.text);
        const toDef = AGENTS.find((a) => a.id === msg.toId);
        result.push({
          text: msg.text.slice(0, 45) + (msg.text.length > 45 ? '...' : ''),
          agentColor: toDef?.color ?? '#66BB6A',
          tick: Math.max(0, tickCount - Math.floor((Date.now() - msg.timestamp) / 4000)),
        });
        if (result.length >= 3) break;
      }
    }
    return result;
  }, [messages, tickCount]);

  // Learning progress — ratio of echo messages to total ticks
  const learningRate = tickCount > 0 ? Math.min(100, Math.round((echoMessages.length / tickCount) * 100 * 2)) : 0;

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="echo-viz">
      {/* Phase */}
      <div className="echo-phase-row">
        <motion.span
          className="echo-phase-badge"
          style={{ '--agent-color': phase.color, borderColor: `${phase.color}40` } as React.CSSProperties}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <span className="echo-phase-dot bg-agent" style={{ '--agent-color': phase.color } as React.CSSProperties} />
          {phase.text}
        </motion.span>
        <span className="echo-engine-tag">MEMORY BANK</span>
      </div>

      {/* Stats row */}
      <div className="echo-stats">
        <div className="echo-stat">
          <span className="echo-stat-value text-green">{storedCount}</span>
          <span className="echo-stat-label">זיכרונות</span>
        </div>
        <div className="echo-stat">
          <span className="echo-stat-value text-cyan">{patternsFound}</span>
          <span className="echo-stat-label">דפוסים</span>
        </div>
        <div className="echo-stat">
          <span className="echo-stat-value text-purple">{echoMessages.length}</span>
          <span className="echo-stat-label">שליפות</span>
        </div>
      </div>

      {/* Learning progress */}
      <div className="echo-learning">
        <div className="echo-learning-label">
          <span>LEARNING RATE</span>
          <span className="text-green">{learningRate}%</span>
        </div>
        <div className="echo-learning-track">
          <motion.div
            className="echo-learning-fill"
            animate={{ width: `${learningRate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Mini timeline — recent memories */}
      {recentMemories.length > 0 && (
        <div className="echo-timeline">
          {recentMemories.map((mem, i) => (
            <motion.div
              key={i}
              className="echo-timeline-item"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.2 }}
            >
              <span className="echo-timeline-dot bg-agent" style={{ '--agent-color': mem.agentColor } as React.CSSProperties} />
              <span className="echo-timeline-text">{mem.text}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Thought */}
      <div className="echo-thought-text">{thought}</div>
    </div>
  );
}
