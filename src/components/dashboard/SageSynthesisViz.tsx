import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { AGENTS } from '../../agents/agentDefinitions';
import { useSimStore } from '../../store/useSimStore';
import { useTypewriter } from '../../hooks/useTypewriter';

interface SageSynthesisVizProps {
  thought: string;
  confidence: number;
}

// Determine Sage's current phase from thought content
function getSagePhase(thought: string): { text: string; color: string } {
  if (thought.includes('סינתזה') || thought.includes('אינטגרציה') || thought.includes('שש'))
    return { text: 'SYNTHESIS', color: '#FFEE58' };
  if (thought.includes('קונצנזוס') || thought.includes('מבקש') || thought.includes('הגישו'))
    return { text: 'CONSENSUS', color: '#66BB6A' };
  if (thought.includes('זהירות') || thought.includes('מחלוקת') || thought.includes('לא-נכונה'))
    return { text: 'CHALLENGE', color: '#EF5350' };
  if (thought.includes('חוכמה') || thought.includes('פרדוקס') || thought.includes('אמת'))
    return { text: 'WISDOM', color: '#B39DDB' };
  if (thought.includes('דפוס') || thought.includes('מבחין') || thought.includes('צמיחה'))
    return { text: 'INSIGHT', color: '#4FC3F7' };
  if (thought.includes('שאלה') || thought.includes('מה'))
    return { text: 'INQUIRY', color: '#FF7043' };
  return { text: 'INTEGRATING', color: '#FFEE58' };
}

export default function SageSynthesisViz({ thought }: SageSynthesisVizProps) {
  const agents = useSimStore((s) => s.agents);
  const phase = useMemo(() => getSagePhase(thought), [thought]);
  const displayedThought = useTypewriter(thought, 20);

  // Other 5 agents (not sage)
  const otherAgents = AGENTS.filter((a) => a.id !== 'sage');

  // Global synthesis level = average confidence of all agents
  const allConfs = Object.values(agents).map((a) => a.confidence);
  const synthesisLevel = Math.round(allConfs.reduce((s, c) => s + c, 0) / allConfs.length);

  if (!thought) return <div className="agent-thought">...</div>;

  return (
    <div className="sage-viz">
      {/* Phase indicator */}
      <div className="sage-phase-row">
        <motion.span
          className="sage-phase-badge"
          style={{ '--agent-color': phase.color, borderColor: `${phase.color}40` } as React.CSSProperties}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <span className="sage-phase-dot bg-agent" style={{ '--agent-color': phase.color } as React.CSSProperties} />
          {phase.text}
        </motion.span>
        <span className="sage-engine-tag">SYNTHESIS ENGINE</span>
      </div>

      {/* Agent perspective pips — shows all 5 other agents with their confidence */}
      <div className="sage-agents-grid">
        {otherAgents.map((a) => {
          const state = agents[a.id];
          const conf = state?.confidence ?? 0;
          return (
            <motion.div
              key={a.id}
              className="sage-agent-pip"
              animate={state?.isThinking ? { borderColor: [`${a.color}40`, a.color, `${a.color}40`] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="sage-agent-pip-dot bg-agent" style={{ '--agent-color': a.color } as React.CSSProperties} />
              <span className="sage-agent-pip-name">{a.name}</span>
              <span className={`sage-agent-pip-conf ${conf >= 70 ? 'text-green' : conf >= 40 ? 'text-yellow' : 'text-red'}`}>{conf}%</span>
            </motion.div>
          );
        })}
      </div>

      {/* Synthesis progress bar */}
      <div className="sage-synthesis-bar">
        <div className="sage-synthesis-label">
          <span>COLLECTIVE SYNTHESIS</span>
          <span className={synthesisLevel >= 70 ? 'text-green' : 'text-yellow'}>{synthesisLevel}%</span>
        </div>
        <div className="sage-synthesis-track">
          <motion.div
            className="sage-synthesis-fill"
            animate={{ width: `${synthesisLevel}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Thought text */}
      <div className="sage-thought-text">{displayedThought}</div>
    </div>
  );
}
